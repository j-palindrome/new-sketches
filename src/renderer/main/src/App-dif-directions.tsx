import { Reactive } from '@reactive/blocks/ParentChildComponents'
import CanvasGL, { Mesh } from '@reactive/components/CanvasGL'
import { wrapPosition } from '@util/shaders/utilities'
import _ from 'lodash'
import { useMemo } from 'react'

export default function App() {
  const positions = useMemo(
    () =>
      _.range((window.innerWidth * window.innerHeight) / 2 ** 2).map((x) => Math.random() * 2 - 1),
    []
  )
  return (
    <>
      <Reactive className="h-screen w-screen">
        <CanvasGL name="canvas" className="h-full w-full">
          <Mesh
            name="mesh"
            vertexShader={
              /*glsl*/ `
              in vec2 position;
              out vec2 vPosition;

              ${wrapPosition}
              void main() {
                vPosition = wrapPosition(position + vec2(0, 0.1 * position.x));

                gl_Position = vec4(vPosition, 0, 1);
                gl_PointSize = 1.0;
              }`
            }
            fragmentShader={
              /*glsl*/ `
              void main() {
                fragColor = vec4(1, 1, 1, 1);
              }`
            }
            attributes={{
              position: { data: positions.flatMap((x) => [x, 1]), numComponents: 2 },
              vPosition: { data: positions.flatMap((x) => [x, 1]), numComponents: 2 }
            }}
            transformFeedback={[['vPosition', 'position']]}
            drawMode="points"
            draw={(self) => self.draw()}
          />
        </CanvasGL>
      </Reactive>
    </>
  )
}
