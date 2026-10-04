import { type RelationsBuilder } from 'drizzle-orm'
import { boolean, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { createModuleTable } from '@lifeforge/drizzle'

const pgTable = createModuleTable()

export const momentVaultEntries = pgTable('entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull().default(''),
  file: jsonb('file').$type<string[]>().notNull().default([]),
  content: text('content').notNull().default(''),
  transcription: text('transcription').notNull().default(''),
  reviewed: boolean('reviewed').notNull().default(false),
  created: timestamp('created', { mode: 'date' }).defaultNow().notNull(),
  updated: timestamp('updated', { mode: 'date' }).defaultNow().notNull()
})

export const tables = { entries: momentVaultEntries }

export const relations = (_r: RelationsBuilder<typeof tables>) => ({})
