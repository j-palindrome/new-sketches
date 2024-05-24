import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Svg from '@reactive/components/Svg'
import * as twgl from 'twgl.js'
import { motion } from 'framer-motion'
import React from 'react'
import CanvasGL, { Mesh, Plane, Texture, VideoPlane } from '@reactive/components/CanvasGL'
import { defaultFragColor, defaultFragSource } from '@util/shaders/utilities'
import { range } from 'lodash'
import { flipY } from '@util/shaders/manipulation'

export default function App() {
  type Context = ReactiveContext<
    {
      curves: WebGLTexture
    },
    { pathPoints: number[]; positions: Float32Array }
  >
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
              console.log(length, 'length')

              let points: SVGPoint[] = []
              for (let i = 0; i < 100; i++) {
                const point = path.getPointAtLength((length / 100) * i)
                points.push(point)
              }
              console.log(points)

              pathPoints.push(points)
            })
            props.pathPoints = pathPoints
              .map((x) =>
                x.map((x) => [
                  (x.x / self.width.baseVal.value) * 2 - 1,
                  (1.0 - x.y / self.height.baseVal.value) * 2 - 1
                ])
              )
              .flat(3)
            console.log(props.pathPoints)
          }}
        >
          <path
            d="M118.5 100.016C103 97.516 70.9 95.616 66.5 108.016C61 123.516 45.5 92.016 31 93.016C16.5 94.016 11 92.016 14.5 82.516C18 73.016 18.5 63.016 12 61.516C5.5 60.016 11 48.516 6 44.516C1 40.516 14.5 29.516 9 24.016C3.5 18.516 2.00008 12.516 5.50004 10.016C8.30001 8.01599 3.66667 3.18266 1 1.01599"
            stroke="black"
          />
          <path
            d="M118.5 81.016C101.833 76.516 68.4 70.916 68 84.516C67.5 101.516 36.5 95.516 38 84.516C39.5 73.516 42 61.016 29.5 60.016C17 59.016 15.5 41.516 18 34.516C20.5 27.516 33 18.516 24.5 13.016C17.7 8.61599 13.3333 3.18266 12 1.01599"
            stroke="black"
          />
          <path
            d="M118.5 50.016C110.333 50.1827 94.1 47.316 94.5 34.516C95 18.516 66.5 37.016 59 29.016C51.5 21.016 59 17.016 59 9.01599C59 2.61599 51 1.01599 47 1.01599"
            stroke="black"
          />
          <path
            d="M101 1.01599C103.167 0.849325 107.2 1.91599 106 7.51599C104.5 14.516 94.5 18.516 103.5 21.016C112.5 23.516 108.5 16.016 112.5 18.516C116.5 21.016 115.5 24.516 118.5 24.016"
            stroke="black"
          />
        </Svg>

        <CanvasGL name="canvas" className="fixed top-0 left-0 w-full h-full">
          <Texture
            name="curves"
            height={4}
            width={100}
            setup={(self, gl, { props }: Omit<Context, 'time'>) => {
              twgl.setTextureFromArray(gl, self, props.pathPoints, {
                width: 100,
                height: 4,
                format: gl.RG,
                type: gl.FLOAT,
                internalFormat: gl.RG32F
              })
              twgl.setTextureParameters(gl, self, {
                min: gl.NEAREST,
                mag: gl.NEAREST
              })
            }}
          />
          {/* <Plane
            name="renderCurves"
            fragmentShader={
              glsl `
              // The texture.
              uniform sampler2D source;

              void main() {
                fragColor = vec4(texture(source, uv).rg, 0, 1);
              }`
            }
            draw={(self, gl, { elements }: Context) => {
              self.draw({ source: elements.curves })
            }}
          /> */}
          <Mesh
            name="hair"
            fragmentShader={defaultFragColor()}
            vertexShader={
              /*glsl*/ `
              in vec2 uv;
              uniform sampler2D curves;
              out vec2 vPosition;
              ${flipY}
              void main() {
                gl_PointSize = 1.0;
                vPosition = texture(curves, uv).xy;
                gl_Position = vec4(vPosition, 0, 1);
              }`
            }
            attributes={{
              uv: {
                data: range(400).flatMap((x) => [
                  (x % 100) / 100 + 1 / 100 / 2,
                  Math.floor(x / 100) / 4 + 1 / 4 / 2
                ]),
                numComponents: 2
              },
              vPosition: {
                data: range(400).flatMap(() => [0, 0]),
                numComponents: 2
              }
            }}
            drawMode="points"
            transformFeedback={[['vPosition', 'vPosition']]}
            setup={(self, parent, { props }) => {
              props.positions = new Float32Array(400)
            }}
            draw={(self, gl, { elements: { curves }, props: { positions } }: Context) => {
              self.draw({
                curves
              })
              gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, self.bufferInfo.attribs!.vPosition.buffer)
              gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, positions)
              // console.log(positions)
            }}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
