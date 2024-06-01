import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Call from '@reactive/components/Call'
import CanvasGL, { Framebuffer, Mesh, Plane } from '@reactive/components/CanvasGL'
import { ellipse, polToCar } from '@util/geometry'
import { uvToCircle } from '@util/shaders/manipulation'
import { PI, uvToPosition, wrapPosition, wrapUv } from '@util/shaders/utilities'
import _ from 'lodash'
import { useMemo } from 'react'
import * as twgl from 'twgl.js'

export default function App() {
  type Types = {
    otherParticles0: twgl.FramebufferInfo
    otherParticles1: twgl.FramebufferInfo
    blur0: twgl.FramebufferInfo
    blur1: twgl.FramebufferInfo
    blurCopy: twgl.FramebufferInfo
    props: { pingPong: boolean; blur: 0 | 1 | 2 }
  }
  return (
    <>
      <Reactive className="h-screen w-screen">
        <Call
          name="props"
          options={{ pingPong: false, blur: 0 }}
          draw={(self) => {
            self.pingPong = !self.pingPong
            self.blur = (self.blur + 1) % 3
          }}
        />
        <CanvasGL
          height={1080}
          width={1080}
          resize={false}
          name="canvas"
          className="h-full w-full"
          setup={(gl) => {
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.clearColor(0, 0, 0, 0)
          }}
        >
          <Mesh
            name="mesh"
            vertexShader={
              /*glsl*/ `
              in vec2 position;
              in float speed;

              out vec2 vPosition;

              uniform float dt;
              uniform sampler2D otherParticles;
              uniform float strength;
              uniform float speedTotal;
              uniform float pointSize;
              
              ${PI}
              ${uvToPosition}
              ${wrapUv}

              void main() {
                vec4 particlesHere = texture(otherParticles, position);
                float onePixel = 1.0 / 128.0;
                float particlesLeft = texture(otherParticles, vec2(mod(position.x - onePixel, 1.0), position.y)).a;
                float particlesRight = texture(otherParticles, vec2(mod(position.x + onePixel, 1.0), position.y)).a;

                vPosition = position + vec2(0.0, 0.0001 + speed * speedTotal * -1.0 * pow((strength + particlesHere.a * (1.0 - strength)), 1.0)) * dt / 1000.0;
                vPosition = wrapUv(vPosition);

                gl_Position = uvToPosition(vPosition);
                gl_PointSize = pointSize;
              }`
            }
            fragmentShader={
              /*glsl*/ `
              uniform float opacity;
              void main() {
                fragColor = vec4(1, 1, 1, opacity);
              }`
            }
            attributes={() => {
              const PARTICLE_AMOUNT = (window.innerWidth * window.innerHeight) / 2 ** 2
              const GROUPS = 500
              const groupSize = PARTICLE_AMOUNT / GROUPS
              const groupRadius = 0.1
              const minSpeed = 0.7
              const groups = _.range(GROUPS).flatMap((i) => {
                const randomCenter = [Math.random(), Math.random()]
                return {
                  position: _.range(groupSize).flatMap(() => {
                    const randomAngle = ellipse(
                      Math.random() * groupRadius * 1.5,
                      Math.random() * groupRadius,
                      Math.random()
                    )
                    return [randomCenter[0] + randomAngle[0], randomCenter[1] + randomAngle[1]]
                  }),
                  speed: Math.random() * (1 - minSpeed) + minSpeed
                }
              })
              return {
                position: { data: groups.flatMap((x) => x.position), numComponents: 2 },
                vPosition: {
                  data: groups.flatMap((x) => x.position),
                  numComponents: 2
                },
                speed: {
                  data: groups.flatMap((x) => _.range(x.position.length).map(() => x.speed)),
                  numComponents: 1
                }
              }
            }}
            transformFeedback={[['vPosition', 'position']]}
            drawMode="points"
            draw={(self, gl, { time: { dt }, elements }) => {
              const { otherParticles0, otherParticles1, blur0, blur1, blurCopy, props } =
                elements as Types
              const uniforms = {
                dt,
                otherParticles: props.pingPong
                  ? otherParticles1.attachments[0]
                  : otherParticles0.attachments[0],
                strength: 0.7,
                speedTotal: 0.5,
                opacity: 0.5,
                pointSize: 1.0
              }
              // 1. render to 512 x 512 particle system framebuffer
              twgl.bindFramebufferInfo(gl, props.pingPong ? otherParticles0 : otherParticles1)
              gl.clear(gl.COLOR_BUFFER_BIT)
              self.draw(uniforms)

              // 2. render to canvas based on positions...
              twgl.bindFramebufferInfo(gl, blur0)
              gl.clear(gl.COLOR_BUFFER_BIT)
              self.draw({ ...uniforms, opacity: 1, pointSize: 1.0 })
            }}
          />
          <Plane
            name="blur"
            fragmentShader={
              /*glsl*/ `
              uniform sampler2D tex;
              uniform sampler2D feedbackTex;
              
              void main() {
                fragColor = texture(tex, uv) + texture(feedbackTex, uv) * 0.2;
              }`
            }
            draw={(self, gl, { elements }) => {
              const { props, blur0, blur1, blurCopy } = elements as Types

              // copy the previously drawn one, then overwrite it
              twgl.bindFramebufferInfo(gl, blur1)
              self.draw({
                tex: blur0.attachments[0],
                feedbackTex: blurCopy.attachments[0],
                blur: [0, 0.5, 0, 0, 1, 0, 0, 0, 0]
              })
            }}
          />
          <Plane
            name="render"
            fragmentShader={
              /*glsl*/ `
              uniform sampler2D tex;
              
              void main() {
                fragColor = texture(tex, uv);
              }`
            }
            draw={(self, gl, { elements }) => {
              const { props, blur0, blur1, blurCopy } = elements as Types

              twgl.bindFramebufferInfo(gl, null)
              gl.clear(gl.COLOR_BUFFER_BIT)
              self.draw({
                tex: blur1.attachments[0]
              })
              gl.bindTexture(gl.TEXTURE_2D, blurCopy.attachments[0])
              gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 1080, 1080, 0)
            }}
          />
          <Framebuffer name="otherParticles0" width={56} height={1024} />
          <Framebuffer name="otherParticles1" width={56} height={1024} />
          <Framebuffer name="blur0" width={1080} height={1080} />
          <Framebuffer name="blur1" width={1080} height={1080} />
          <Framebuffer name="blurCopy" width={1080} height={1080} />
        </CanvasGL>
      </Reactive>
    </>
  )
}
