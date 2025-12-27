// Mock for framer-motion in tests
import React from 'react'

export const motion = {
  div: React.forwardRef(({ children, className, animate, initial, transition, ...props }, ref) => {
    return React.createElement('div', { ref, className, ...props }, children)
  }),
}

export default { motion }

