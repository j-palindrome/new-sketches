import { Reactive } from '@reactive/blocks/ParentChildComponents'
import AudioCtx, { AudioNodes } from '@reactive/components/AudioCtx'
import Call from '@reactive/components/Call'
import CanvasGL, { Mesh, Plane, Texture } from '@reactive/components/CanvasGL'
import Elementary from '@reactive/components/Elementary'
import Processing from '@reactive/components/Processing'
import { generateShape } from '@util/layer'
import { range } from 'lodash'
import * as twgl from 'twgl.js'

export default function App() {
  type Context = ReactiveContext<
    {
      data: { randomRain: number[][] }
      rain: WebGLTexture
    },
    {}
  >
  const count = 10000
  return (
    <Reactive className="h-screen w-screen">
      <Call
        name="data"
        props={{
          randomRain: range(count).map((x) => [
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random()
          ])
        }}
      />
      {/* <Processing
        type="p2d"
        name="processing"
        setup={(p) => {
          p.colorMode(p.HSL, 1)
          p.angleMode(p.RADIANS)
          p.noStroke()
        }}
        draw={(p, { elements, time }: Context) => {
          let i = 0
          p.clear()
          for (let drop of elements.data.randomRain) {
            i += 0.1
            const progress = (time + i) % 1
            const point = p.createVector(p.width * drop[0], p.height * drop[1])
            p.fill(1, drop[2] * (1 - progress) ** 0.5)
            p.circle(point.x, point.y, progress ** 2 * 100)
          }
        }}
      /> */}

      <CanvasGL
        name="canvas"
        setup={(gl) => {
          gl.disable(gl.DEPTH_TEST)
        }}
      >
        <Mesh
          name="drops"
          instanceCount={count}
          attributes={{
            instance: { numComponents: 4, divisor: 1 },
            position: {
              numComponents: 2,
              data: generateShape('squareCenter')
            },
            iUv: {
              numComponents: 2,
              data: generateShape('square')
            }
          }}
          drawMode="triangles"
          vertexShader={
            /*glsl*/ `
            in vec2 position;
            in vec2 iUv;
            in vec4 instance;
            out vec2 uv;
            out float progress;
            uniform float time;
            void main() {
              // gl_Position = vec4(instance.xy * 2.0 - 1.0 + position * 0.1, 0, 1);
              gl_Position = vec4(position * instance.z + (instance.xy * 2.0 - 1.0), 0, 1);
              progress = fract(time * instance.z);
              uv = iUv;
            }`
          }
          fragmentShader={
            /*glsl*/ `
            in float progress;
            in vec2 uv;
            void main() {
              float thisProgress = pow(progress * 0.5, 2.0);
              float circleCoord = length(uv - 0.5);
              if (circleCoord > thisProgress) discard;
              fragColor = vec4(1, 1, 1, (1.0 - (circleCoord / thisProgress)) * 0.1);
            }`
          }
          setup={(self, gl, { elements }: Context) => {
            self.draw(
              {},
              {
                instance: {
                  numComponents: 4,
                  data: elements.data.randomRain.flat(),
                  divisor: 1
                }
              }
            )
          }}
          draw={(self, gl, { time }) => {
            self.draw({ time })
          }}
        />
        {/* <Texture
          name="rain"
          setup={(self, gl, { elements }: Context) => {
            console.log(elements.data.randomRain)

            twgl.setTextureFromArray(
              gl,
              self,
              elements.data.randomRain.flatMap((x) => x * 255),
              { width: 100, height: 1 }
            )
            twgl.setTextureParameters(gl, self, {
              mag: gl.NEAREST,
              min: gl.NEAREST
            })
          }}
        /> */}
        {/* <Plane
          name="visuals"
          fragmentShader={
            glsl `
            uniform sampler2D rain;
            uniform float time;
            void main() {
              
            }`
          }
          draw={(self, gl, { elements, time }: Context) => {
            self.draw({
              rain: elements.rain,
              time
            })
          }}
        /> */}
      </CanvasGL>
      <AudioCtx name="audio">
        <Elementary
          name="elementary"
          setup={({ node }, ctx) => {
            node.connect(ctx.destination)
          }}
          draw={(self) => {}}
          deps={1000}
        />
        <AudioNodes
          name="gain"
          nodes={(ctx) => {
            return { gain: ctx.createGain() }
          }}
          setup={({ gain }, ctx, { elements }) => {
            elements.elementary.node.connect(gain)
            gain.connect(ctx.destination)
          }}
        />
      </AudioCtx>
    </Reactive>
  )
}
