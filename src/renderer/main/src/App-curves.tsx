import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Call from '@reactive/components/Call'
import CanvasGL, { Framebuffer, Mesh, Plane, Texture } from '@reactive/components/CanvasGL'
import { ellipse, polToCar } from '@util/geometry'
import { uvToCircle } from '@util/shaders/manipulation'
import {
  PI,
  defaultFragColor,
  defaultVert2D,
  defaultVert2DNoResolution,
  positionToNorm,
  uvToPosition,
  wrapPosition,
  wrapUv
} from '@util/shaders/utilities'
import _ from 'lodash'
import { useMemo } from 'react'
import * as twgl from 'twgl.js'
import { Algorithmic } from 'total-serialism'
import { Curve, Group, Pt } from 'pts'
import normals from 'polyline-normals'
import bezier from 'adaptive-bezier-curve'
import { SplineCurve, Vector2 } from 'three'
import { sine } from '@util/math'
import { rad, scale } from '../../../../util/src/math'

// a series of wavy lines that blow to the left and out while they wave.
// fractal circles—like a lindenmayer system
export default function App() {
  type Types = {}

  // get each to snake randomly like the noise particles...
  // maybe try an instanced draw with each of those...or pass a normal to each of the curved particles...
  // shouldn't they solve their own Béziers within that curved portion?

  const generateAttributes = (t: number, index: number) => {
    type CurveInfo = {
      position: number[]
      normal: number[]
      miter: number[]
      indices: number[]
    }
    // const linden: string = Algorithmic.linden('AB', 3, { AB: 'ABAB', B: 'BA' })

    const generateCurve = (points: Pt[], startIndex: number = 0) => {
      const curve = new SplineCurve(points.map((x) => new Vector2(...x)))
      let vertices = curve.getSpacedPoints(points.length * 50).map((x) => x.toArray())

      let getNormals = normals(vertices)
      let position = vertices.map((x) => [x, x]).flat(2)
      let normal = getNormals.map((x) => [x[0], x[0]]).flat(2)
      let miter = getNormals
        .map((x) => {
          const maxMiter = _.clamp(x[1], 1)
          return [-maxMiter, maxMiter]
        })
        .flat()

      const indices: number[] = []
      // jump through every position length
      for (let i = startIndex; i < vertices.length * 2 + startIndex - 2; i += 2) {
        indices.push(i, i + 1, i + 2, i + 1, i + 2, i + 3)
      }
      return {
        position: position.flat(),
        normal,
        miter,
        indices
      } as CurveInfo
    }

    const curves: CurveInfo[] = []
    const linden = Algorithmic.linden('A', 4, { A: 'AB', B: 'BA' })

    const size = 1

    const points = new Group()
    let { position, heading } = { position: new Pt(0, 0), heading: new Pt(0, -1) }
    points.push(position.clone())
    linden.split('').forEach((x, i) => {
      if (x === 'A') {
        const curve = new Group(position.$add(0, 1), position.$add(1, 1))
          .rotate2D(heading.angle(), position)
          .scale(size * 1.3)
        points.push(...curve)
        position.add(new Pt(1, 1).rotate2D(heading.angle()).scale(size))
        heading.rotate2D(t % rad(1))
      } else if (x === 'B') {
        const curve = new Group(position.$add(0, 1), position.$add(1, 1))
          .rotate2D(heading.angle(), position)
          .scale(size)
        points.push(...curve)
        position.add(new Pt(1, 1).rotate2D(heading.angle()).scale(size))
        heading.rotate2D((-t * 0.7) % rad(1))
      }
    })
    curves.push(generateCurve(points.scale(0.2)))

    return {
      position: {
        data: curves.flatMap((x) => x.position),
        numComponents: 2
      },
      normal: {
        data: curves.flatMap((x) => x.normal),
        numComponents: 2
      },
      miter: { data: curves.flatMap((x) => x.miter), numComponents: 1 },
      indices: { data: curves.flatMap((x) => x.indices) }
    }
  }
  return (
    <>
      <Reactive className="h-screen w-screen" loop={true}>
        <CanvasGL name="canvas" className="h-full w-full" height={1080} width={1080}>
          <Framebuffer
            name="curveTarget"
            height={1920}
            width={1920}
            draw={(self, gl) => {
              twgl.bindFramebufferInfo(gl, self)
            }}
          ></Framebuffer>
          <Mesh
            name="curves"
            attributes={generateAttributes(0, 1)}
            fragmentShader={
              /*glsl*/ `
              void main() {
                fragColor = vec4(1, 1, 1, 1);
              }`
            }
            vertexShader={
              /*glsl*/ `
              in vec2 position;
              in vec2 normal;
              in float miter;
              uniform vec2 resolution;

              ${wrapPosition}

              void main() {
                float thickness = 10.0 / resolution.x;
                //push the point along its normal by half thickness
                vec2 p = position.xy + vec2(normal * thickness / 2.0 * miter);
                // vec2 p = position + vec2(0.0, miter * thickness / 2.0);
                // vec2 p = position;
                gl_Position = vec4(p, 0, 1);
                gl_PointSize = 1.0;
              }`
            }
            drawMode="triangles"
            draw={(self, gl, { time: { t }, elements }) => {
              gl.clear(gl.COLOR_BUFFER_BIT)
              self.draw(
                { resolution: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
                generateAttributes(t / 1000, 1)
              )
            }}
          />

          <Framebuffer
            name="renderDestBuffer"
            draw={(self, gl) => {
              twgl.bindFramebufferInfo(gl, self)
            }}
          />
          <Plane
            name="renderDest"
            fragmentShader={
              /*glsl*/ `
              uniform sampler2D renderDest;
              uniform sampler2D feedback;
              uniform float matrix[9];

              vec4 blur(sampler2D textureInput) {
                vec4 sampleStart = vec4(0, 0, 0, 0);
                float onePixel = 1.0 / 1080.0;
                for (int i = -1; i < 2; i ++) {
                  for (int j = -1; j < 2; j ++) {
                    sampleStart += texture(textureInput, vec2(0, 0) + vec2(i, j) * onePixel) * matrix[(i + 1) * 3 + (j + 1)];
                  }
                }
                return sampleStart;
              }
              void main() {
                fragColor = texture(renderDest, uv) + blur(feedback) * 0.0025;
              }`
            }
            draw={(self, gl, { elements }) => {
              const { curveTarget, feedback } = elements
              self.draw({
                renderDest: curveTarget.attachments[0],
                feedback,
                // matrix: [0, 1, 0, 1, 1, 1, 0, 1, 0]
                matrix: [0, 1, 0, 2, 0, 0, 0, 0, 0]
              })
            }}
          />
          <Plane
            name="render"
            xywh={[-1.1, 1.1, 2.1, 2.1]}
            fragmentShader={
              /*glsl*/ `
              uniform sampler2D renderDestBuffer;
              void main() {
                fragColor = texture(renderDestBuffer, uv);
              }`
            }
            draw={(self, gl, { elements }) => {
              const { renderDestBuffer } = elements
              twgl.bindFramebufferInfo(gl, null)
              self.draw({
                renderDestBuffer: renderDestBuffer.attachments[0]
              })
            }}
          />

          <Texture
            name="feedback"
            draw={(self, gl) => {
              gl.bindTexture(gl.TEXTURE_2D, self)
              gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 1078, 1078, 0)
            }}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
