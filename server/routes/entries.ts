import { count, desc, eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import fs from 'fs'
import z from 'zod'

import forge from '../forge'
import { momentVaultEntries } from '../schema.drizzle'
import { convertToMp3 } from '../utils/convertToMP3'

const AUDIO_CONTAINER_MIMES = ['video/webm', 'video/mp4', 'video/ogg']

const entryDto = createSelectSchema(momentVaultEntries).extend({
  file: z.array(z.string())
})

export const list = forge
  .query({
    description: 'Get paginated list of moment vault entries',
    input: {
      query: z.object({
        page: z.string().optional().default('1')
      })
    },
    output: {
      OK: z.object({
        items: z.array(entryDto),
        page: z.number(),
        perPage: z.number(),
        totalItems: z.number(),
        totalPages: z.number()
      })
    }
  })
  .callback(async ({ db, query: { page }, response }) => {
    const parsedPage = parseInt(page ?? '1', 10) || 1

    const perPage = 10

    const items = await db
      .select()
      .from(momentVaultEntries)
      .orderBy(desc(momentVaultEntries.created))
      .limit(perPage)
      .offset((parsedPage - 1) * perPage)

    const [totalRow] = await db
      .select({ value: count() })
      .from(momentVaultEntries)

    return response.ok({
      items,
      page: parsedPage,
      perPage,
      totalItems: totalRow.value,
      totalPages: Math.ceil(totalRow.value / perPage)
    })
  })

export const create = forge
  .mutation({
    description: 'Create a new moment vault entry',
    input: {
      body: z.object({
        type: z.enum(['text', 'audio', 'photos']),
        content: z.string().optional(),
        transcription: z.string().optional()
      })
    },
    media: {
      files: {
        multiple: true,
        optional: true
      }
    },
    output: {
      CREATED: entryDto
    }
  })
  .callback(
    async ({
      db,
      body: { type, content, transcription },
      media: { files },
      core,
      response
    }) => {
      if (type === 'audio') {
        if (!files?.length) {
          return response.badRequest('No file uploaded')
        }

        if (files.length > 1) {
          return response.badRequest('Only one audio file is allowed')
        }

        const audio = files[0]

        if (typeof audio === 'string') {
          return response.badRequest('Invalid file')
        }

        // `file-type` detects audio-only WebM/MP4 containers as `video/*`,
        // so accept those in addition to `audio/*`.
        if (
          !audio.mimeType.startsWith('audio/') &&
          !AUDIO_CONTAINER_MIMES.includes(audio.mimeType)
        ) {
          return response.badRequest('File must be an audio file')
        }

        let filePath = audio.path

        if (audio.mimeType !== 'audio/mp3') {
          filePath = await convertToMp3(filePath)
        }

        const buffer = fs.readFileSync(filePath)

        const ref = await core.storage.save({
          file: {
            buffer,
            originalName: 'audio.mp3',
            mimeType: 'audio/mpeg'
          }
        })

        fs.unlinkSync(filePath)

        const [entry] = await db
          .insert(momentVaultEntries)
          .values({
            type: 'audio',
            file: ref ? [ref.key] : [],
            transcription: transcription ?? ''
          })
          .returning()

        return response.created(entry)
      }

      if (type === 'text') {
        if (!content) {
          return response.badRequest('Content is required for text entries')
        }

        const [entry] = await db
          .insert(momentVaultEntries)
          .values({ type: 'text', content })
          .returning()

        return response.created(entry)
      }

      if (type === 'photos') {
        if (!files?.length) {
          return response.badRequest('No files uploaded')
        }

        const refs = await Promise.all(
          files.map(file =>
            typeof file === 'string'
              ? null
              : core.storage.save({ file })
          )
        )

        const [entry] = await db
          .insert(momentVaultEntries)
          .values({
            type: 'photos',
            file: refs.filter(Boolean).map(ref => ref!.key)
          })
          .returning()

        return response.created(entry)
      }

      return response.badRequest('Invalid entry type')
    }
  )

export const update = forge
  .mutation({
    description: 'Update content of a moment vault entry',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries)
      }),
      body: z.object({
        content: z.string()
      })
    },
    output: {
      OK: entryDto
    }
  })
  .callback(async ({ db, query: { id }, body: { content }, response }) => {
    const [updated] = await db
      .update(momentVaultEntries)
      .set({ content, updated: new Date() })
      .where(eq(momentVaultEntries.id, id))
      .returning()

    return response.ok(updated)
  })

export const toggleReviewed = forge
  .mutation({
    description: 'Toggle reviewed status of an audio entry',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries)
      })
    },
    output: {
      OK: entryDto
    }
  })
  .callback(async ({ db, query: { id }, response }) => {
    const entry = (await db.query.entries.findFirst({ where: { id } }))!

    if (entry.type !== 'audio') {
      return response.badRequest(
        'Reviewed status can only be toggled for audio entries'
      )
    }

    const [updated] = await db
      .update(momentVaultEntries)
      .set({ reviewed: !entry.reviewed, updated: new Date() })
      .where(eq(momentVaultEntries.id, id))
      .returning()

    return response.ok(updated)
  })

export const remove = forge
  .mutation({
    description: 'Delete a moment vault entry',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries)
      })
    },
    output: {
      NO_CONTENT: true
    }
  })
  .callback(async ({ db, query: { id }, core, response }) => {
    const entry = await db.query.entries.findFirst({ where: { id } })

    if (entry) {
      for (const key of entry.file) {
        if (key) {
          await core.storage.delete(key)
        }
      }
    }

    await db.delete(momentVaultEntries).where(eq(momentVaultEntries.id, id))

    return response.noContent()
  })
