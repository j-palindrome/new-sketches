import { Reactive } from '@reactive/blocks/ParentChildComponents'
import AudioCtx, { AudioNodes } from '@reactive/components/AudioCtx'
import Call from '@reactive/components/Call'
import CanvasGL, { Mesh, Plane, Texture } from '@reactive/components/CanvasGL'
import Elementary from '@reactive/components/Elementary'
import HydraTS from '@reactive/components/Hydra'
import Processing from '@reactive/components/Processing'
import { generateShape } from '@util/layer'
import { sine } from '@util/math'
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

      <HydraTS
        name="hydra"
        setup={({ hydra, generators }) => {
          hydra.loop.start()
        }}
        draw={({ hydra, generators }, { time }) => {
          generators
            .osc(() => 20 * sine(time, sine(time), (time * 8) % 100), 1.0, 0)
            .rotate(Math.PI / 2)
            .add(generators.osc(() => Math.random(), 0.2).rotate(Math.PI / 2))
            .sub(
              generators.osc(() => 200).rotate(() => Math.random() * sine(time, 5, 0.1) * Math.PI)
            )
            .brightness(-1)
            .out(hydra.outputs[0])
          hydra.render(hydra.outputs[0])
        }}
      ></HydraTS>
      <AudioCtx name="audio">
        <Elementary
          name="elementary"
          setup={async ({ el, core }) => {
            const convolutionArray = new Float32Array(44100)
            for (let i = 0; i < convolutionArray.length; i++) {
              // convolutionArray[i] = (44100 - i) / 44100
              convolutionArray[i] = Math.random()
            }
            await core.updateVirtualFileSystem({
              convolution: convolutionArray
            })
          }}
          draw={({ el, core }, ctx, { time }) => {
            const channel = (i: number) =>
              el.min(
                1,
                el.max(
                  -1,
                  // el.convolve({ path: 'convolution', key: 'convolution' }, el.train(50))
                  el.lowshelf(
                    800,
                    10,
                    10,
                    el.table(
                      { path: 'convolution', key: 'convolution' },
                      el.phasor(el.const({ key: 'thing', value: 1000 + i * 340.345 }))
                    )
                  )
                )
              )
            // el.table({ path: 'convolution' }, el.phasor(100))
            core.render(channel(0), channel(1))
          }}
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
          draw={({ gain }) => {
            gain.gain.value = 0.9
          }}
        />
      </AudioCtx>
    </Reactive>
  )
}
