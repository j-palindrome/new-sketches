import { Reactive } from '@reactive/blocks/ParentChildComponents'
import CanvasGL, { Framebuffer, Mesh, Plane } from '@reactive/components/CanvasGL'
import { range } from 'lodash'
import * as twgl from 'twgl.js'
import random from 'glsl-random/index.glsl?raw'
import noise from 'glsl-noise/simplex/2d.glsl?raw'
import { fixGlslify } from '@util/shaders/utilities'
import { lerp } from '@util/shaders/curve'

export default function App() {
  type Context = ReactiveContext<{ tex0: WebGLTexture; dataGen: SVGSVGElement }, {}>
  const width = 10
  const height = 10
  let lastTime = new Date().getTime()

  return (
    <>
      <Reactive className="h-screen w-screen">
        <CanvasGL name="mainCanvas" className="h-full w-full absolute top-0 left-0">
          <Framebuffer
            height={height}
            width={width}
            name="try"
            draw={(self, gl) => twgl.bindFramebufferInfo(gl, self)}
          >
            <Plane
              name="try2"
              fragmentShader={
                /*glsl*/ `
                uniform float t;

                ${fixGlslify(random)}
                ${fixGlslify(noise)}
                
                void main() {
                  // fragColor = vec4(1.0 - uv.y + random(vec2(uv.x * t * 0.1543, uv.y * t * 0.5345)) * 0.2, uv.x, random(vec2(uv.x * t * 0.1564, uv.y * t * 0.1435)), random(vec2(uv.x * t * 0.2545, uv.y * t * 0.5435)));
                  // fragColor = vec4(1.0 - uv.y, uv.x, random(vec2(uv.x * 0.1545, uv.y * 0.12543)), random(vec2(uv.x * 0.1543, uv.y * 0.57829)));
                  fragColor = vec4(snoise(uv + t), snoise(vec2(uv.x * 0.14345, uv.y * 0.1949) + t), snoise(vec2(uv.x * 0.14353, uv.y * 0.185439) + t), snoise(vec2(uv.x * 0.1545, uv.y * 0.29539) + t));
                }`
              }
              draw={(self, gl, { t }) => {
                self.draw({ t })
                twgl.bindFramebufferInfo(gl, null)
              }}
            />
          </Framebuffer>
          <Mesh
            name="indexes"
            draw={(self, gl, { t, elements }) => {
              // 10000 curves: 0.22 ms!
              // twgl.bindFramebufferInfo(gl, null)
              self.draw({ time: t / 2, width, height, random: elements.try.attachments[0] })
            }}
            attributes={{
              t: { numComponents: 1, data: range(width) }
            }}
            vertexShader={
              /* glsl */ `
              in float t;
              uniform float time;
              uniform sampler2D random;
              uniform float width;
              uniform float height;
              
              void main() {
                // the curve is written along the x-axis, the curve changes along the y-axis.
                vec2 start = vec2(floor(t) / (width), mod(time, 1.0) * (1.0 - 1.0 / height * 2.0) + 1.0 / height);
                vec4 thisCoord = texture(random, start);
                // vec4 nextCoord = texture(random, start + vec2(1.0 / width, 0));

                vec2 p0 = thisCoord.xy;
                // vec2 thisControl = thisCoord.zw;
                // vec2 p3 = nextCoord.xy;
                // vec2 nextControl = nextCoord.zw;

                // vec2 p1 = p0 + thisControl;
                // vec2 p2 = nextControl * -1.0 + p3;
                // vec2 pos = cubicBezier(mod(t, 1.0), p0, p1, p2, p3);
                // vec2 pos = lerp(t, p0, p3);
                vec2 pos = p0;

                gl_Position = vec4((pos * 2.0 - 1.0), 0, 1);
                gl_PointSize = 10.0;
              }`
            }
            fragmentShader={
              /* glsl */ `
              void main() {
                fragColor = vec4(1, 1, 1, 0.9);
              }`
            }
            drawMode="line strip"
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
