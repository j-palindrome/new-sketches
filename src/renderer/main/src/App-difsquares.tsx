import { Reactive } from '@reactive/blocks/ParentChildComponents'
import CanvasGL, { Mesh } from '@reactive/components/CanvasGL'
import { PI, uvToPosition, wrapPosition } from '@util/shaders/utilities'
import _ from 'lodash'
import { useMemo } from 'react'

export default function App() {
  const { positions, random } = useMemo(() => {
    const PARTICLE_AMOUNT = _.range((window.innerWidth * window.innerHeight) / 2 ** 2)
    return {
      positions: PARTICLE_AMOUNT.map((x) => Math.random()),
      random: PARTICLE_AMOUNT.map(() => Math.random())
    }
  }, [])
  return (
    <>
      <Reactive className="h-screen w-screen">
        <CanvasGL name="canvas" className="h-full w-full">
          <Mesh
            name="mesh"
            vertexShader={
              /*glsl*/ `
              in vec2 position;
              in float random;
              out vec2 vPosition;
              
              ${PI}
              ${uvToPosition}

              const float r_inner = 0.25; 
              const float r_outer = 0.5; 

              void main() {

                vPosition = position + vec2(0, 0.1 * position.x);
                vPosition = mod(vPosition, 1.0);
                float radius = length(vPosition);
                float angle = atan(vPosition.y, vPosition.x);

                gl_Position = uvToPosition(mod(vec2(radius, angle) + 0.5, 1.0));
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
              vPosition: { data: positions.flatMap((x) => [x, 1]), numComponents: 2 },
              random: { data: random, numComponents: 1 }
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
