// Simple example test to verify test setup works
import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    const message = 'Hello World'
    expect(message).toContain('Hello')
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })
})

