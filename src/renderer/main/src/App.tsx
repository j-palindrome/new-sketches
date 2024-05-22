import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Call from '@reactive/components/Call'
import CanvasGL, { Framebuffer, Mesh, Plane } from '@reactive/components/CanvasGL'
import { ellipse, polToCar } from '@util/geometry'
import { uvToCircle } from '@util/shaders/manipulation'
import {
  PI,
  defaultFragColor,
  defaultVert2D,
  defaultVert2DNoResolution,
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
    const linden = 'ABBAABBA'

    let size = 0.1

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

    for (let instance = 0; instance < 2; instance++) {
      const points = new Group()
      let pointer = new Pt(0, 0)
      points.push(pointer.clone())
      linden.split('').forEach((x, i) => {
        const instanceT = t * (instance + 1)
        if (x === 'A') {
          points.push(
            pointer.$add(0, -size * 0.5 * Math.sin(instanceT / Math.PI / 2)),
            pointer.$add(
              sine(instanceT, 0.3 + i * 0.23, 0.12),
              sine(instanceT, 0.21, (-size / 2) * 0.4)
            ),
            pointer.$add(sine(instanceT, 1 / 1.4, 0.2), sine(instanceT, 1 / 3.9, -size))
          )
          pointer.add(sine(instanceT, 1 / 1.4, 0.2), sine(instanceT, 1 / 3.9, -size))
        } else if (x === 'B') {
          points.push(
            pointer.$add(
              sine(instanceT + i, 0.9, -0.12),
              sine(instanceT + i * 0.2, 0.7, -size / 2)
            ),
            pointer.$add(sine(instanceT, 0.6, 0.12), sine(instanceT, 1.2, -0.6))
          )
          pointer.add(sine(instanceT, 0.6, 0.12), sine(instanceT, 1.2, -0.6))
        }
      })
      curves.push(generateCurve(points))
    }

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
        <CanvasGL name="canvas" className="h-full w-full">
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
            draw={(self, gl, { time: { t } }) => {
              self.draw(
                { resolution: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
                generateAttributes(t / 1000, 1)
              )
            }}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
