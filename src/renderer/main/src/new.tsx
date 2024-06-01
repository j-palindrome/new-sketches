import { Reactive } from '@reactive/blocks/ParentChildComponents'
import AudioCtx, { AudioNodes } from '@reactive/components/AudioCtx'
import Call from '@reactive/components/Call'
import CanvasGL, { Mesh, Plane } from '@reactive/components/CanvasGL'
import Elementary from '@reactive/components/Elementary'
import generateHydraShader from '@reactive/utilities/generateHydraShader'

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
      <Call name="data" props={{}} />

      <CanvasGL name="canvas">
        <Plane
          name="mesh"
          fragmentShader={generateHydraShader((synth) =>
            synth
              .saw(3, 1.0)
              .hash(synth.saw(2.3, -0.8))
              .hash(synth.saw(5.9, -0.4))
              .blend(synth.saw(3, 2.0).rotate(Math.PI / 2), 0.4)
          )}
          draw={(self, gl, { time }) => {
            self.draw({
              time
            })
          }}
        />
      </CanvasGL>
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
            const channel = (i: number) => el.min(1, el.max(-1, el.noise()))
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
