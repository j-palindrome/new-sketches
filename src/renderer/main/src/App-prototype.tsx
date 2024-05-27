import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Canvas2D from '@reactive/components/Canvas2D'
import CanvasGL, { Framebuffer, Plane, Texture, VideoPlane } from '@reactive/components/CanvasGL'
import Processing from '@reactive/components/Processing'
import { range } from 'lodash'
import { Pt } from 'pts'
import * as twgl from 'twgl.js'
import type p5 from 'p5'
import { scale } from '../../../../util/src/math'
import { fixGlslify } from '@util/shaders/utilities'
import snoise from 'glsl-noise/simplex/3d.glsl?raw'

export default function App() {
  const width = 4
  type Context = ReactiveContext<
    {
      prototype: p5
      source: WebGLTexture
      feedback: twgl.FramebufferInfo
      effectRender: twgl.FramebufferInfo
    },
    {
      curves: number[][]
    }
  >
  return (
    <Reactive className="h-screen w-screen">
      <CanvasGL
        name="canvas"
        height={1600}
        width={1600}
        noResize
        glOptions={{ preserveDrawingBuffer: true }}
      >
        <Texture
          name="source"
          height={1600}
          width={1600}
          draw={(self, gl, { elements: { prototype } }: Context) => {
            twgl.setTextureFromElement(gl, self, prototype.drawingContext.canvas, {
              height: 1600,
              width: 1600
            })
          }}
        />

        <Plane
          name="drawEffect"
          fragmentShader={
            /*glsl*/ `
            uniform sampler2D feedback;
            void main() {
              if (texture(feedback, uv).r < 0.2) {
                fragColor = vec4(0, 0, 0, 1);
              } else {
                fragColor = vec4(0, 0, 0, 0.01);
              }
              // fragColor = texture(feedback, uv) * 1.2;
            }`
          }
          draw={(self, gl, { elements }) =>
            self.draw({
              feedback: elements.feedback
            })
          }
        />

        <Plane
          name="effect"
          fragmentShader={
            /* glsl */ `
              uniform sampler2D source;
              uniform sampler2D feedback;
              uniform float t;
              ${fixGlslify(snoise)}

              void main() {
                if (mod((uv.x + mod(t, 1.0)) * resolution.x, 5.0) < 2.5) {
                  vec4 texSample = texture(source, uv);
                  if (texSample.a > 0.0) {
                    fragColor = vec4(1.0, 1.0, 1.0, snoise(vec3(uv * 100.0, t)));
                    return;
                  }
                }
                discard;
              }`
          }
          draw={(self, gl, { t, elements }: Context) => {
            self.draw({
              source: elements.source,
              t
            })
          }}
        />
        <Texture
          name="feedback"
          height={1600}
          width={1600}
          draw={(self, gl) => {
            gl.bindTexture(gl.TEXTURE_2D, self)
            gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 1600, 1600, 0)
          }}
        />
      </CanvasGL>
      <Processing
        type="p2d"
        name="prototype"
        className="!h-full !w-full"
        setup={(p, { props }) => {
          p.angleMode(p.RADIANS)
          p.scale(p.width, p.height)
          p.strokeWeight(5 / p.width)
          p.stroke('white')
          p.noFill()
          const curves = range(30).map(() => range(10).map(() => Math.random() * 2 - 1))
          props.curves = curves
        }}
        draw={(p, { t, props: { curves } }: Context) => {
          p.clear()

          const speed = 0.03
          let i = 0
          for (let noisePoints of curves) {
            i++
            const curveProgress =
              (t * speed + (i / curves.length) * (i > curves.length / 2 ? -1 : 1)) % 1
            p.beginShape()
            const heading = p.createVector(0, 1).rotate(curveProgress * p.TWO_PI)
            const currentPoint = p.createVector(0.5, 0.5)
            const points: any = []
            for (let i = 0; i < noisePoints.length; i++) {
              for (let j = 0; j < 10; j++) {
                heading.rotate(
                  (noisePoints[i] / 10) * p.TWO_PI * (p.sin(curveProgress * p.TWO_PI) / 2 + 0.5)
                )
                currentPoint.add(heading.copy().setMag(0.02 * curveProgress))
                points.push([currentPoint.x, currentPoint.y])
                p.vertex(currentPoint.x, currentPoint.y)
              }
            }
            p.endShape()
          }
        }}
      />
    </Reactive>
  )
}
