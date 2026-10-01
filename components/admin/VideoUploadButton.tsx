'use client'

import React, { useRef, useState } from 'react'

export type VideoUploadResult = {
  url: string
  posterUrl: string
  fileId: string
}

const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'mov']
const MAX_VIDEO_MB = 100

// Uploads a video straight from the browser to ImageKit using a short-lived
// signature from /api/imagekit/auth. Going direct (not through our server)
// matters for videos: serverless request bodies are capped at a few MB, which
// the image upload route would hit immediately.
export function VideoUploadButton({
  folder = '/teenzos/videos',
  onSuccess,
  children,
}: {
  folder?: string
  onSuccess: (result: VideoUploadResult) => void
  children: (props: { open: () => void; isUploading: boolean; progress: number }) => React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      alert(`Unsupported file type. Please upload a ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} video.`)
      return
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`Video is too large. Maximum size is ${MAX_VIDEO_MB}MB — please compress it and try again.`)
      return
    }

    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    if (!publicKey) {
      alert('ImageKit public key is not configured (NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY).')
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      const authResponse = await fetch('/api/imagekit/auth', { cache: 'no-store' })
      const auth = await authResponse.json().catch(() => ({}))
      if (!authResponse.ok || !auth.token) {
        throw new Error(auth.error || 'Could not get an upload signature. Are you logged in as admin?')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)
      formData.append('folder', folder)
      formData.append('useUniqueFileName', 'true')
      formData.append('publicKey', publicKey)
      formData.append('signature', auth.signature)
      formData.append('expire', String(auth.expire))
      formData.append('token', auth.token)

      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
          let body: any = null
          try {
            body = JSON.parse(xhr.responseText)
          } catch {}
          if (xhr.status >= 200 && xhr.status < 300 && body?.url) resolve(body)
          else reject(new Error(body?.message || `Upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Network error while uploading the video.'))
        xhr.send(formData)
      })

      onSuccess({
        url: data.url,
        // ImageKit renders a still frame from any uploaded video at this URL.
        posterUrl: `${data.url}/ik-thumbnail.jpg`,
        fileId: data.fileId,
      })
    } catch (error: any) {
      console.error('Video upload error:', error)
      alert(error?.message || 'Video upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />
      {children({ open: () => inputRef.current?.click(), isUploading, progress })}
    </>
  )
}
