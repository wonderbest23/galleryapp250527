// app/providers.tsx

import {HeroUIProvider} from '@heroui/react'

export default function Providers({children}) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  )
}
