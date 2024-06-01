import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Svg from '@reactive/components/Svg'
import * as twgl from 'twgl.js'
import { motion } from 'framer-motion'
import React, { useState } from 'react'
import CanvasGL, {
  MeshCurve,
  Framebuffer,
  Mesh,
  Plane,
  Texture,
  VideoPlane,
  LineCurve
} from '@reactive/components/CanvasGL'
import generateHydraShader from '@reactive/utilities/generateHydraShader'
import Canvas2D from '@reactive/components/Canvas2D'
import Processing, { ProcessingGL } from '@reactive/components/Processing'
import { initBezier } from 'p5bezier'
import _, { range } from 'lodash'
import { clock } from '@util/math'
import { defaultFragColor } from '@util/shaders/utilities'
import { LoopPingPong } from 'three'

const shader = generateHydraShader((h) => {
  return h.src(h.s0).modulate(h.noise(5, 0.4), 0.2)
})
console.log(shader)
const preFilledRandoms = new Float32Array(100000).map((x) => Math.random())

export default function App() {
  type Context = ReactiveContext<{ tex0: WebGLTexture; dataGen: SVGSVGElement }, {}>
  const width = 100
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
        <CanvasGL
          name="mainCanvas"
          className="h-full w-full absolute top-0 left-0"
          height={1920}
          width={1080}
          resize={false}
        >
          {/* <LineCurve
            name="curves"
            subdivisions={100}
            fragmentShader={
              glsl `
                void main() {
                  fragColor = vec4(1.0, 1.0, 1.0, 1);
                }
              `
            }
            draw={(self, gl) => {
              const thisTime = new Date().getTime()
              // console.log(thisTime - lastTime)
              lastTime = thisTime
              // 1000 1 stroke: 8.6 ms
              // 10000 1 stroke: 90.5ms, 1 frame and 6 partially presented frames
              // 10000 many strokes: 100 ms draw
              self.draw(
                range(10000).map(() => {
                  return range(2).map(() => {
                    const start = [Math.random() * 2 - 1, Math.random() * 2 - 1] as [number, number]
                    const direction = start.map((x) => Math.random() * 2 - 1) as [number, number]
                    return {
                      start,
                      direction,
                      width: 1 / gl.drawingBufferWidth
                    }
                  })
                })
              )
            }}
          /> */}
        </CanvasGL>
      </Reactive>
    </>
  )
}
