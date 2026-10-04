import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import z from 'zod'

import forge from '../forge'
import { momentVaultEntries } from '../schema.drizzle'
import { convertToMp3 } from '../utils/convertToMP3'
import { getTranscription } from '../utils/transcription'

const entryDto = createSelectSchema(momentVaultEntries).extend({
  file: z.array(z.string())
})

export const transcribeExisted = forge
  .mutation({
    description: 'Transcribe an existing audio entry',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries)
      })
    },
    output: {
      OK: z.string()
    }
  })
  .callback(
    async ({
      db,
      query: { id },
      core: {
        api: { getAPIKey },
        storage
      },
      response
    }) => {
      const apiKey = await getAPIKey('openai')

      if (!apiKey) {
        return response.badRequest('API key not found')
      }

      const entry = await db.query.entries.findFirst({ where: { id } })

      if (!entry || entry.file.length === 0) {
        return response.badRequest('No audio file found in entry')
      }

      const fileStream = await storage.get(entry.file[0])

      if (!fileStream) {
        return response.badRequest('Audio file not found')
      }

      const tempPath = path.join(
        os.tmpdir(),
        `${crypto.randomUUID()}${path.extname(entry.file[0])}`
      )

      try {
        await pipeline(fileStream.stream, fs.createWriteStream(tempPath))

        let filePath = tempPath

        if (!filePath.endsWith('.mp3')) {
          filePath = await convertToMp3(filePath)
        }

        const transcriptionText = await getTranscription(filePath, apiKey)

        if (!transcriptionText) {
          return response.badRequest('Transcription failed')
        }

        await db
          .update(momentVaultEntries)
          .set({ transcription: transcriptionText, updated: new Date() })
          .where(eq(momentVaultEntries.id, id))

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        return response.ok(transcriptionText)
      } catch (err) {
        console.error('Error during transcription:', err)

        return response.badRequest('Failed to transcribe audio file')
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath)
        }
      }
    }
  )

export const transcribeNew = forge
  .mutation({
    description: 'Transcribe a new audio file',
    media: {
      file: {
        optional: false
      }
    },
    output: {
      OK: z.string()
    }
  })
  .callback(
    async ({
      media: { file },
      core: {
        api: { getAPIKey }
      },
      response
    }) => {
      if (!file || typeof file === 'string') {
        return response.badRequest('No file uploaded')
      }

      let filePath = file.path

      if (file.mimeType !== 'audio/mp3') {
        filePath = await convertToMp3(filePath)
      }

      const apiKey = await getAPIKey('openai')

      if (!apiKey) {
        return response.badRequest('API key not found')
      }

      const transcriptionText = await getTranscription(filePath, apiKey)

      if (!transcriptionText) {
        return response.badRequest('Transcription failed')
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      return response.ok(transcriptionText)
    }
  )

export const updateTranscription = forge
  .mutation({
    description: 'Update transcription of an audio entry',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries)
      }),
      body: z.object({
        transcription: z.string()
      })
    },
    output: {
      OK: entryDto
    }
  })
  .callback(async ({ db, query: { id }, body: { transcription }, response }) => {
    const [updated] = await db
      .update(momentVaultEntries)
      .set({ transcription, updated: new Date() })
      .where(eq(momentVaultEntries.id, id))
      .returning()

    return response.ok(updated)
  })

export const cleanupTranscription = forge
  .mutation({
    description: 'Clean up and improve transcription text',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), momentVaultEntries),
        newText: z.string().optional()
      })
    },
    output: {
      OK: z.string()
    }
  })
  .callback(
    async ({
      db,
      query: { id, newText },
      core: {
        api: { getAPIKey, fetchAI }
      },
      response
    }) => {
      const apiKey = await getAPIKey('openai')

      if (!apiKey) {
        return response.badRequest('API key not found')
      }

      let textToCleanUp: string

      if (!newText) {
        const entry = (await db.query.entries.findFirst({
          where: { id }
        }))!

        if (!entry.transcription) {
          return response.badRequest('No transcription data to clean up')
        }

        textToCleanUp = entry.transcription
      } else {
        textToCleanUp = newText
      }

      const aiResponse = await fetchAI({
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert text cleaner. Your task is to clean up the provided transcription text by adding appropriate punctuation, fixing grammatical errors, and improving overall readability. Ensure the cleaned transcription maintains the original wordings and meaning while enhancing its clarity and flow.'
          },
          {
            role: 'user',
            content: `Please clean up the following transcription:\n\n${textToCleanUp}`
          }
        ],
        structure: z.object({
          cleanedTranscription: z.string()
        })
      })

      if (!aiResponse || !aiResponse.cleanedTranscription) {
        return response.badRequest('Failed to clean up transcription')
      }

      return response.ok(aiResponse.cleanedTranscription)
    }
  )
