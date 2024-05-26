import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Svg from '@reactive/components/Svg'
import * as twgl from 'twgl.js'
import { motion } from 'framer-motion'
import React from 'react'
import CanvasGL, { Mesh, Plane, Texture, VideoPlane } from '@reactive/components/CanvasGL'
import { PI, defaultFragColor, defaultFragSource } from '@util/shaders/utilities'
import { range } from 'lodash'
import { flipY } from '@util/shaders/manipulation'
import { bezierN } from '@util/curve'

export default function App() {
  type Context = ReactiveContext<
    {
      curves: WebGLTexture
    },
    { pathPoints: number[]; positions: Float32Array }
  >
  const width = 500
  const amount = 1000
  const opacity = 0.06
  const pointSize = 1.0
  return (
    <>
      <Reactive>
        <Svg
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
          <path
            d="M111 2.5C117.5 7.16667 128.1 17 118.5 19C106.5 21.5 110 4 104 11.5C98 19 111.5 48 113.5 36.5C115.5 25 95 25 96.5 30C98 35 120.5 57.5 104 56C87.5 54.5 121.5 28 124 35C126 40.6 132.167 28 135 21"
            stroke="black"
          />
          <path
            d="M84 1C90 7.5 100.2 21.1 93 23.5C84 26.5 64.5 29 76 35C87.5 41 79 17 72.5 19C66 21 55 49.5 70.5 49.5C86 49.5 75 69 69 62.5C63 56 81.5001 45.5 84 54C86.5 62.5 74 85 87 80.5C100 76 90 71.5 87 71C84 70.5 62.5 71 67.5 82.5C72.5 94 82.5 99 87 92.5C91.5 86 109 77 106.5 87.5C104 98 106.5 109.5 113.5 98.5C120.5 87.5 91 91.5 94.5 98.5C97.3 104.1 109.667 109.167 115.5 111"
            stroke="black"
          />
          <path
            d="M41.5 2C46.3333 16.8333 57.9 43.9 65.5 33.5C75 20.5 35 38 63 53.5C91 69 52.5 59.5 52.5 71C52.5 82.5 73.5 66 63 61C52.5 56 26.5 69 37 77.5C47.5 86 88 77.5 68.5 89.5C49 101.5 75 115.5 79 100C83 84.5 52.5 84.5 52.5 91.5C52.5 98.5 51 122 60.5 116.5"
            stroke="black"
          />
          <path
            d="M23 12C12.3333 13 -6.3 19 4.50001 35C18 55 19.5 58 36 53.5C52.5 49 -0.500005 33 2 52C4.50001 71 38 105.5 20 107C2 108.5 15 134.5 29 119.5C43 104.5 86.5 113 73.5 119.5"
            stroke="black"
          />
        </Svg>

        <CanvasGL name="canvas" className="fixed top-0 left-0 w-full h-full">
          <Texture
            name="curves"
            height={4}
            width={width}
            setup={(self, gl, { props }: Omit<Context, 'time'>) => {
              twgl.setTextureFromArray(gl, self, props.pathPoints, {
                width: width,
                height: 4,
                // THIS is the only format which is filterable (i.e. you can use LINEAR)
                // other formats require you to use NEAREST instead
                format: gl.RG,
                type: gl.FLOAT,
                internalFormat: gl.RG16F
              })
              twgl.setTextureParameters(gl, self, {
                min: gl.LINEAR,
                mag: gl.LINEAR,
                wrap: gl.CLAMP_TO_EDGE
              })
            }}
          />
          <Mesh
            name="blowing"
            attributes={{
              row: {
                data: range(amount).flatMap(() => range(width).map((x) => x / width)),
                numComponents: 1
              },
              offset: {
                data: range(amount).flatMap((offset) => {
                  offset = Math.random() * amount
                  return range(width).map(() => offset / amount)
                  //offset / amount *
                }),
                numComponents: 1
              },
              delays: {
                data: range(amount).flatMap(() => {
                  const randIncrease = Math.random()
                  return range(width).flatMap(() => {
                    return range(4).map((i) => (i / 4) * randIncrease)
                  })
                }),
                numComponents: 4
              }
            }}
            vertexShader={
              /*glsl*/ `
              uniform sampler2D curves;
              uniform float t;
              in float row;
              in float offset;
              in vec4 delays;
              out float vColor;
              ${PI}

              ${bezierN(3)}

              void main() {
                vec2 pos = vec2(mod(t + offset, 1.0), row);
                float progress = 1.0 - mod(t + offset, 1.0);
                vec2 bezierPoints[4] = vec2[4](${range(4).map((i) => /*glsl*/ `texture(curves, vec2(pow(progress, 1.0 + ${i}.0 * 3.0) + delays.${'xyzw'[i]}, ${(i / 4).toFixed(1)} + 1.0 / 4.0 / 2.0)).xy * (offset * 0.2 + 1.0)`)});
                vColor = pow(progress, 5.0);
                gl_Position = vec4(bezierN(row, bezierPoints), 0, 1); 
                gl_PointSize = ${pointSize.toFixed(2)};
              }`
            }
            fragmentShader={
              /*glsl*/ `
            in float vColor;
            ${PI}
            void main() {
              fragColor = vec4(1.0, 1.0, 1.0, 0.2 + vColor * 0.8);
            }`
            }
            drawMode="points"
            draw={(self, gl, { time: { t }, elements: { curves } }: Context) => {
              self.draw({
                t: t / 20,
                curves
              })
            }}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
