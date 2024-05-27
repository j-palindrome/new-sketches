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
      effectFrame: twgl.FramebufferInfo
    },
    {
      curves: number[][]
    }
  >
  return (
    <Reactive className="h-screen w-screen">
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
          const speed = 0.1
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
      <CanvasGL name="canvas" height={1600} width={1600} noResize>
        <Texture
          name="source"
          draw={(self, gl, { elements: { prototype } }: Context) => {
            twgl.setTextureFromElement(gl, self, prototype.drawingContext.canvas, {
              height: 1600,
              width: 1600
            })
          }}
        />
        <Framebuffer name="effectFrame">
          <Plane
            name="effect"
            fragmentShader={
              /* glsl */ `
              uniform sampler2D source;
              uniform sampler2D feedback;
              uniform float t;
              ${fixGlslify(snoise)}

              void main() {
                fragColor = vec4(0, 0, 0, 0);
                if (mod((uv.x + mod(t, 1.0)) * resolution.x, 5.0) < 2.5) {
                  vec4 texSample = texture(source, uv);
                  if (texSample.a > 0.0) {
                    fragColor = vec4(1.0, 1.0, 1.0, snoise(vec3(uv * 100.0, t)));
                  }
                }
                fragColor = mix(fragColor, texture(feedback, uv), 0.1);
              }`
            }
            draw={(self, gl, { t, elements: { source, feedback, effectFrame } }: Context) => {
              twgl.bindFramebufferInfo(gl, effectFrame)
              self.draw({
                source,
                feedback: feedback.attachments[0],
                t
              })
            }}
          />
        </Framebuffer>

        {/* // https://medium.com/@josecastrovaron/analyzing-optic-and-filmic-effects-in-webgl-47abe74df74e */}
        <Framebuffer name="feedback">
          <Plane
            name="render"
            fragmentShader={
              /*glsl*/ `
              uniform sampler2D source;
              
              void main() {
                fragColor = texture(source, uv);
              }`
            }
            draw={(self, gl, { elements }: Context) => {
              twgl.bindFramebufferInfo(gl, elements.feedback)
              self.draw({ source: elements.effectFrame.attachments[0] })
              twgl.bindFramebufferInfo(gl, null)
              self.draw({ source: elements.effectFrame.attachments[0] })
            }}
          />
        </Framebuffer>
      </CanvasGL>
    </Reactive>
  )
}
