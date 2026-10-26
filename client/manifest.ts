import { lazy } from 'react'

import { createForgeModule } from '@lifeforge/federation'

import type { Contract } from './contract'

const { forgeAPI, ...manifest } = createForgeModule<Contract>({
  routes: {
    '/': lazy(() => import('@'))
  },
  widgets: [() => import('@/widgets/QuickAudioCapture')]
})

export default manifest

export { forgeAPI }
