import { createForgeContractBuilder } from '@lifeforge/server-utils'

import * as schema from './schema.drizzle'

export type MomentVaultSchema = typeof schema

const forge = createForgeContractBuilder({ schema })

export default forge
