import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Svg from '@reactive/components/Svg'
import * as twgl from 'twgl.js'
import { motion } from 'framer-motion'
import React, { useState } from 'react'
import CanvasGL, {
  AttribCurve,
  Framebuffer,
  Mesh,
  Plane,
  Texture,
  VideoPlane
} from '@reactive/components/CanvasGL'
import generateHydraShader from '@reactive/utilities/generateHydraShader'
import Canvas2D from '@reactive/components/Canvas2D'
import Processing, { ProcessingGL } from '@reactive/components/Processing'
import { initBezier } from 'p5bezier'
import _, { range } from 'lodash'
import { clock } from '@util/math'

const shader = generateHydraShader((h) => {
  return h.src(h.s0).modulate(h.noise(5, 0.4), 0.2)
})
console.log(shader)

export default function App() {
  type Context = ReactiveContext<{ tex0: WebGLTexture; dataGen: SVGSVGElement }, {}>
  const width = 100
  return (
    <>
      <Reactive className="h-screen w-screen">
        <Svg
          className="absolute top-0 left-0 hidden"
          name="dataGen"
          width={119}
          height={113}
          setup={(self, { elements, props }) => {
            const paths = self.querySelectorAll('path')
            const pathPoints: SVGPoint[][] = []
            paths.forEach((path) => {
              const length = path.getTotalLength()

              let points: SVGPoint[] = []
              for (let i = 0; i < width; i++) {
                const point = path.getPointAtLength((length / width) * i)
                points.push(point)
              }

              pathPoints.push(points)
            })
            props.pathPoints = pathPoints
              .map((x) =>
                x.map((x) => [
                  (x.x / (self.width.baseVal.value - 10)) * 2 - 1,
                  (1.0 - x.y / (self.height.baseVal.value - 10)) * 2 - 1
                ])
              )
              .flat(3)
          }}
        >
          <g stroke="white" fill="none" strokeWidth={1}>
            <path d="M111 2.5C117.5 7.16667 128.1 17 118.5 19C106.5 21.5 110 4 104 11.5C98 19 111.5 48 113.5 36.5C115.5 25 95 25 96.5 30C98 35 120.5 57.5 104 56C87.5 54.5 121.5 28 124 35C126 40.6 132.167 28 135 21" />
            <path d="M84 1C90 7.5 100.2 21.1 93 23.5C84 26.5 64.5 29 76 35C87.5 41 79 17 72.5 19C66 21 55 49.5 70.5 49.5C86 49.5 75 69 69 62.5C63 56 81.5001 45.5 84 54C86.5 62.5 74 85 87 80.5C100 76 90 71.5 87 71C84 70.5 62.5 71 67.5 82.5C72.5 94 82.5 99 87 92.5C91.5 86 109 77 106.5 87.5C104 98 106.5 109.5 113.5 98.5C120.5 87.5 91 91.5 94.5 98.5C97.3 104.1 109.667 109.167 115.5 111" />
            <path d="M41.5 2C46.3333 16.8333 57.9 43.9 65.5 33.5C75 20.5 35 38 63 53.5C91 69 52.5 59.5 52.5 71C52.5 82.5 73.5 66 63 61C52.5 56 26.5 69 37 77.5C47.5 86 88 77.5 68.5 89.5C49 101.5 75 115.5 79 100C83 84.5 52.5 84.5 52.5 91.5C52.5 98.5 51 122 60.5 116.5" />
            <path d="M23 12C12.3333 13 -6.3 19 4.50001 35C18 55 19.5 58 36 53.5C52.5 49 -0.500005 33 2 52C4.50001 71 38 105.5 20 107C2 108.5 15 134.5 29 119.5C43 104.5 86.5 113 73.5 119.5" />
          </g>
        </Svg>
        <CanvasGL name="mainCanvas" className="h-full w-full absolute top-0 left-0">
          <AttribCurve
            name="curves"
            curves={[
              {
                points: range(7).map(() => ({
                  points: [
                    [Math.random() * 2 - 1, Math.random() * 2 - 1],
                    [Math.random() * 2 - 1, Math.random() * 2 - 1],
                    [Math.random() * 2 - 1, Math.random() * 2 - 1]
                  ],
                  width: 0.02 + Math.random() * 0.01
                })),
                end: { point: [0, 0], width: 0.02 + Math.random() * 0.01 }
              }
            ]}
            subdivisions={10}
            draw={(self) => {
              self.draw()
            }}
          />
        </CanvasGL>

        {/* <CanvasGL>
          <Mesh fragmentShader='' setup={self => {
          }}></Mesh>
        </CanvasGL> */}
      </Reactive>
    </>
  )
}
