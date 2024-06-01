import { Reactive } from '@reactive/blocks/ParentChildComponents'
import AudioCtx from '@reactive/components/AudioCtx'
import CanvasGL, { Framebuffer, Mesh, Plane } from '@reactive/components/CanvasGL'
import Elementary from '@reactive/components/Elementary'
import { generateShape } from '@util/layer'
import { luma } from '@util/shaders/color'
import { hydraGenerator, hydraModulator } from '@util/shaders/hydra'
import { defaultFragColor, positionToNorm } from '@util/shaders/utilities'
import { generators } from 'hydra-ts'
import { range } from 'lodash'
import * as twgl from 'twgl.js'
import { mtof } from '../../../../util/src/math'

export default function App() {
  return (
    <Reactive className="h-screen w-screen">
      <CanvasGL name="canvas" className="h-screen w-[100vh] mx-auto">
        <Framebuffer
          name="generationBuf"
          draw={(self, gl) => {
            twgl.bindFramebufferInfo(gl, self)
          }}
        >
          <Plane
            name="generation"
            fragmentShader={
              /*glsl*/ `
              uniform float time;

              ${hydraGenerator('voronoi')}
              ${luma}

              float getDifference(vec2 uv, float scaleMult) {
                return abs(voronoi(uv, 1.0 * scaleMult, 0.5, 0.5) - voronoi(uv + vec2(1.0 / resolution.x, 0), 1.243 * scaleMult, 2.0, 0.5)).r;
              }

              float extractDifference(vec2 uv) {
                float mult = 5.0;
                float difference = abs(getDifference(uv, mult) - getDifference(uv + vec2(0, 4.0 / resolution.y), mult));
                vec4 color = vec4(0, 0, 0, 0);
                if (difference > 0.3) {
                  return difference;
                } return 0.0;
              }

              void main() {
                fragColor = vec4(1, 1, 1, extractDifference(uv));
              }`
            }
            draw={(self, gl, { time: t }) => {
              gl.clear(gl.COLOR_BUFFER_BIT)
              self.draw({ time: t, resolution: [1842, 1600] })
            }}
          />
        </Framebuffer>
        <Mesh
          name="bricks"
          drawMode="triangles"
          instanceCount={40}
          attributes={{
            position: {
              data: generateShape('plane'),
              numComponents: 2
            }
          }}
          vertexShader={
            /*glsl*/ `
            in vec3 position;
            out vec2 uv;
            uniform vec2 resolution;
            out float opacity;
            ${positionToNorm}
            void main() {
              gl_Position = vec4(position - float(gl_InstanceID) / 60.0, 1);
              uv = positionToNorm(position.xy);
              opacity = 1.0 - float(gl_InstanceID) / 40.0;
            }`
          }
          fragmentShader={
            /* glsl */ `
            uniform sampler2D source;
            in vec2 uv;
            in float opacity;
            void main() {
              vec4 texSample = texture(source, uv);
              texSample.a *= opacity;
              fragColor = texSample;
            }`
          }
          draw={(self, gl, { time: t, elements }) => {
            twgl.bindFramebufferInfo(gl, null)
            self.draw({
              time: t,
              resolution: [gl.drawingBufferWidth, gl.drawingBufferHeight],
              source: elements.generationBuf.attachments[0]
            })
          }}
        />
      </CanvasGL>
      <AudioCtx name="audio">
        <Elementary
          name="elementary"
          setup={({ el, core, node }, ctx) => {
            node.connect(ctx.destination)
            const intervals = range(8).map(() => 0.5 + Math.random() / 2)
            const signal = range(8).map((i) =>
              el.mul(
                el.adsr(
                  0.3,
                  2,
                  0,
                  2,
                  el.train(
                    el.mul(el.const({ key: `gate-${i}`, value: intervals[i] }), el.phasor(1 / 0.25))
                  )
                ),
                el.square(mtof(30 + i * 8.9))
              )
            )
            const channel = el.div(el.add(...signal), 8)
            core.render(channel, channel)
          }}
        />
      </AudioCtx>
    </Reactive>
  )
}
