import { useState, useEffect } from 'react'

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export function useDevice() {
  const [device, setDevice] = useState<DeviceType>('desktop')

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth
      if (width <= 479) {
        setDevice('mobile')
      } else if (width <= 991) {
        setDevice('tablet')
      } else {
        setDevice('desktop')
      }
    }
    
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return device
}
