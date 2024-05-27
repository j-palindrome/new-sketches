import { Reactive } from '@reactive/blocks/ParentChildComponents'
import CanvasGL, { Mesh, Texture } from '@reactive/components/CanvasGL'
import _, { range } from 'lodash'
import * as twgl from 'twgl.js'

export default function App() {
  type Context = ReactiveContext<{ tex0: WebGLTexture; dataGen: SVGSVGElement }, {}>
  const width = 10
  const height = 10
  let lastTime = new Date().getTime()
  return (
    <>
      <Reactive className="h-screen w-screen">
        {/* <Svg
          className="absolute top-0 left-0"
          name="dataGen"
          width={1}
          height={1}
          viewBox="0 0 1 1"
          setup={(self, { elements, props }) => {
            // const paths = self.querySelectorAll('path')
            // const pathPoints: SVGPoint[][] = []
            // paths.forEach((path) => {
            //   const length = path.getTotalLength()
            //   let points: SVGPoint[] = []
            //   for (let i = 0; i < width; i++) {
            //     const point = path.getPointAtLength((length / width) * i)
            //     points.push(point)
            //   }
            //   pathPoints.push(points)
            // })
            // props.pathPoints = pathPoints
            //   .map((x) =>
            //     x.map((x) => [
            //       (x.x / (self.width.baseVal.value - 10)) * 2 - 1,
            //       (1.0 - x.y / (self.height.baseVal.value - 10)) * 2 - 1
            //     ])
            //   )
            //   .flat(3)
          }}
          draw={(self) => {
            return
            // 150-313 ms on the GPU to calculate this
            const path =
              `M ${Math.random()} ${Math.random()}` +
              range(1000).map(
                (x) =>
                  `C ${Math.random()} ${Math.random()} ${Math.random()} ${Math.random()} ${Math.random()} ${Math.random()}`
              )
            document.getElementById('thisPath')?.setAttribute('d', path)
          }}
        >
          <path id="thisPath" stroke="white" strokeWidth={1 / 1080} />
        </Svg> */}
        {/* <Processing
          name="processingTestMany"
          type="p2d"
          className="!h-full !w-full absolute top-0 left-0"
          height={1920}
          width={1080}
          resize={false}
          setup={(p) => {
            p.strokeWeight(1 / 1080)
            p.scale(p.width, p.height)
            const stroke = p.color('white')
            stroke.setAlpha(0.2)
            p.stroke('white')
            p.noFill()
          }}
          draw={(p) => {
            // 1000 1 stroke: 0.35 ms
            // 1000 many strokes: 0.35 ms
            // 10000 many: 2 frames and 5 dropped frames
            /// 10000 one: 2 and 5 dropped frames
            p.clear()
            p.beginShape()
            p.vertex(Math.random(), Math.random())
            for (let i = 0; i < 10000; i++) {
              p.bezierVertex(
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random()
              )
            }
            p.endShape()
          }}
        /> */}
        {/* <Canvas2D
          name="2dTestMany"
          className="h-full w-full absolute top-0 left-0"
          height={1920}
          width={1080}
          resize={false}
          setup={(self) => {
            self.lineWidth = 1 / 1080
            self.strokeStyle = 'white'
            self.scale(1080, 1920)
            self.globalAlpha = 0.8
          }}
          draw={(self) => {
            // 1000 many strokes random: 5.3s GPU, 1.5ms CPU
            // 10000 many strokes random: 75.32ms GPU, 1 frame and 4 dropped frames
            self.clearRect(0, 0, 1, 1)
            for (let i = 0; i < 10000; i++) {
              self.beginPath()
              self.moveTo(Math.random(), Math.random())
              self.bezierCurveTo(
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random()
              )
              self.stroke()
            }
          }}
        ></Canvas2D> */}
        <CanvasGL name="mainCanvas" className="h-full w-full absolute top-0 left-0">
          {/* <Framebuffer name="try" draw={(self, gl) => twgl.bindFramebufferInfo(gl, self)}>
            <Plane
              name="try2"
              fragmentShader={
                glsl `
                void main() {
                  fragColor = vec4(1, 1, 1, 1);
                }`
              }
              draw={(self) => self.draw()}
            />
          </Framebuffer> */}
          <Texture
            name="random"
            height={height}
            width={width}
            setup={(self, gl) => {
              const array = range(width * height).flatMap((x) => {
                const curveProgress = Math.floor(x / width) / (height - 1)
                const vertexProgress = (x % width) / (width - 1)
                return [
                  _.clamp(1 - curveProgress + Math.random() * 0.1, 0, 1),
                  _.clamp(vertexProgress + Math.random() * 0.1, 0, 1),
                  Math.random(),
                  Math.random()
                ]
              })
              console.log(array)

              twgl.setTextureFromArray(
                gl,
                self,
                // maps to [{x, y}, {x, y}]
                array.map((x) => x * 255),
                { height, width }
              )
              twgl.setTextureParameters(gl, self, {
                mag: gl.LINEAR,
                min: gl.LINEAR,
                wrap: gl.CLAMP_TO_EDGE
              })
            }}
          />
          {/* <VideoPlane
            name="render"
            source={'random'}
            draw={(self, gl, { elements }) => {
              twgl.bindFramebufferInfo(gl, null)
              // self.draw({ source: elements.try.attachments[0] })
              self.draw({ source: elements.random })
            }}
          /> */}
          <Mesh
            name="indexes"
            attributes={{
              t: { numComponents: 1, data: range(width * 100).flatMap((x) => x / 100) }
            }}
            vertexShader={
              /* glsl */ `
              in float t;
              uniform float time;
              uniform sampler2D random;
              uniform float width;
              uniform float height;

              ${cubicBezier}
              
              void main() {
                // the curve is written along the x-axis, the curve changes along the y-axis.
                vec2 start = vec2(floor(t) / (width), mod(time, 1.0) * (1.0 - 1.0 / height * 2.0) + 1.0 / height);
                vec4 thisCoord = texture(random, start);
                vec4 nextCoord = texture(random, start + vec2(1.0 / width, 0));

                vec2 p0 = thisCoord.xy;
                vec2 thisControl = thisCoord.zw;
                vec2 p3 = nextCoord.xy;
                vec2 nextControl = nextCoord.zw;

                vec2 p1 = p0 + thisControl;
                vec2 p2 = nextControl * -1.0 + p3;
                vec2 pos = cubicBezier(mod(t, 1.0), p0, p1, p2, p3);

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
            draw={(self, gl, { t }) => {
              // 10000 curves: 0.22 ms!
              twgl.bindFramebufferInfo(gl, null)
              self.draw({ time: t / 2, width, height })
            }}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
