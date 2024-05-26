import { Reactive } from '@reactive/blocks/ParentChildComponents'
import Svg from '@reactive/components/Svg'
import * as twgl from 'twgl.js'
import { motion } from 'framer-motion'
import Hydra from '@reactive/components/Hydra'

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
      <motion.svg className="h-full w-full" height={37} width={104} viewBox="0 0 37 104">
        <motion.path
          stroke="white"
          strokeWidth={0.2}
          animate={{
            d: [
              'M59.378 1.39955C61.4869 1.85166 75.0125 4.12487 70.6789 12.457C66.5307 20.4326 62.5471 34.877 73.8669 28.3409C77.498 26.2443 64.3159 48.953 68.6335 47.5141C80.6955 43.4941 76.2283 74.773 83.4569 59.4636C87.2697 51.3885 64.8906 60.7061 78.1794 77.5796C90.1414 92.7685 65.7439 72.9145 91.8781 88.1558C103.437 94.8971 80.9848 101.814 79.7401 102.851',
              'M58 2C60.2739 2.82114 64.2488 6.23707 61.9567 13.3317C59.0915 22.2 58.6822 30.822 63.321 31.8073C67.9599 32.7927 64.6854 40.922 64.0032 46.0951C63.321 51.2683 58.9551 65.5561 66.5955 66.5415C72.7078 67.3298 71.204 77.3805 66.5955 81.322C61.4109 85.7561 53.4976 95.1663 63.321 97.3341C75.6003 100.044 69.8699 102.261 68.2327 103',
              'M56.9552 2C53.2819 2.7561 44.9552 8 50.5637 12.4341C66.4575 25 60.9552 37.5 54.4552 33.5C48.0267 29.544 46.1557 37.839 47.2577 42.6024C48.3597 47.3659 29.4552 32.5 40.4254 51.5C45.3759 60.0739 39.8132 62.8707 47.2577 66.5C55.6328 70.5829 55.4552 86.5 40.4254 84.5C20.6081 81.8629 37.7807 94.3195 40.4254 95',
              'M53.7152 2C46.9623 2.7561 43.1432 6.8588 44.5 18C46.3877 33.5 38.4494 30 26.5 26C14.682 22.044 24.4742 34.7366 26.5 39.5C28.5259 44.2634 -16.5 38 8.99999 48C20.6403 52.5648 13 69.5 21 56C29.1205 42.2967 48.6359 68.0808 21 70C-15 72.5 26.5 91 39 74.5'
            ]
          }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 5 }}
        />
      </motion.svg>
      <Reactive>
        <Hydra draw={(self) => {}} />
      </Reactive>
    </>
  )
}
