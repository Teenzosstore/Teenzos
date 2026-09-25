'use server'

import { requireAdmin } from '@/lib/adminAuth'

export type MediaItem = { folder: string; name: string; url: string }

export async function listMediaImages(): Promise<MediaItem[]> {
  const admin = await requireAdmin()
  if (admin.ok === false) {
    throw new Error(admin.error)
  }

  const storage = admin.adminClient.storage.from('rawflex')
  const items: MediaItem[] = []

  const walk = async (path: string, label: string) => {
    const { data, error } = await storage.list(path, {
      limit: 1000,
      offset: 0,
    })

    if (error) {
      throw new Error(error.message)
    }

    for (const entry of data || []) {
      const childPath = path ? `${path}/${entry.name}` : entry.name
      const childLabel = path ? `${label} / ${entry.name}` : entry.name

      if (!entry.id) {
        await walk(childPath, childLabel)
        continue
      }

      const { data: publicUrl } = storage.getPublicUrl(childPath)
      items.push({
        folder: label,
        name: entry.name,
        url: publicUrl.publicUrl,
      })
    }
  }

  for (const folder of ['categories', 'hero', 'lookbook', 'site', 'samples']) {
    await walk(folder, folder)
  }

  return items
}
