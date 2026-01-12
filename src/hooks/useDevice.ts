import { useState, useEffect } from 'react'

export type DeviceType = 'desktop' | 'mobile'

export function useDevice() {
  const [device, setDevice] = useState<DeviceType>('desktop')

  useEffect(() => {
    const check = () => {
      // 991px is standard tablet break point
      setDevice(window.innerWidth <= 991 ? 'mobile' : 'desktop')
    }
    
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return device
}
