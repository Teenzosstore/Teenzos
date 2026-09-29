'use client'

import React, { useRef, useState } from 'react'

export interface ImageKitUploadResult {
  fileId: string
  url: string
  name: string
  size?: number
  filePath?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  info: {
    secure_url: string
    url: string
    public_id: string
    fileId: string
    width?: number
    height?: number
    original_filename?: string
  }
}

export interface ImageKitUploadOptions {
  folder?: string
  maxFiles?: number
  multiple?: boolean
  clientAllowedFormats?: string[]
  maxFileSize?: number // in bytes
  resourceType?: string
}

export interface ImageKitUploadWidgetProps {
  options?: ImageKitUploadOptions
  onSuccess?: (result: ImageKitUploadResult) => void
  onError?: (error: any) => void
  onOpen?: () => void
  onClose?: () => void
  onQueuesEnd?: () => void
  onAbort?: () => void
  signatureEndpoint?: string // kept for prop compatibility
  children: (props: {
    open: () => void
    isUploading: boolean
    progress: number
  }) => React.ReactNode
}

export function ImageKitUploadWidget({
  options = {},
  onSuccess,
  onError,
  onOpen,
  onClose,
  onQueuesEnd,
  onAbort,
  children,
}: ImageKitUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const maxFiles = options.maxFiles ?? 1
  const isMultiple = options.multiple ?? maxFiles > 1

  const allowedFormats = options.clientAllowedFormats || ['jpg', 'jpeg', 'png', 'webp']
  const acceptAttr = allowedFormats
    .map((fmt) => (fmt.startsWith('.') ? fmt : `.${fmt}`))
    .join(',')

  const handleOpen = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Safety timeout: If user cancels file picker dialog, reset any loading state
    const handleFocusBack = () => {
      setTimeout(() => {
        if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
          setIsUploading(false)
          setProgress(0)
          onAbort?.()
          onClose?.()
        }
      }, 600)
    }
    window.addEventListener('focus', handleFocusBack, { once: true })

    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      setIsUploading(false)
      setProgress(0)
      onAbort?.()
      onClose?.()
      return
    }

    if (files.length > maxFiles) {
      const msg = `You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''} at a time.`
      alert(msg)
      onError?.(new Error(msg))
      setIsUploading(false)
      onClose?.()
      return
    }

    const maxSizeBytes = options.maxFileSize || 15 * 1024 * 1024 // 15MB default

    // Signal that upload is actually beginning now that file is selected
    onOpen?.()
    setIsUploading(true)
    setProgress(20)

    const folder = options.folder
      ? options.folder.startsWith('/')
        ? options.folder
        : `/${options.folder}`
      : '/teenzos'

    try {
      const fileList = Array.from(files)
      let completedCount = 0

      for (const file of fileList) {
        if (file.size > maxSizeBytes) {
          const msg = `File "${file.name}" exceeds the maximum allowed size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`
          alert(msg)
          onError?.(new Error(msg))
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name)
        formData.append('folder', folder)

        // Upload through fast, secure server endpoint
        const uploadResponse = await fetch('/api/imagekit/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorResult = await uploadResponse.json().catch(() => ({}))
          throw new Error(
            errorResult.error || errorResult.message || `Upload failed with status ${uploadResponse.status}`
          )
        }

        const data = await uploadResponse.json()

        const normalizedResult: ImageKitUploadResult = {
          fileId: data.fileId,
          url: data.url,
          name: data.name,
          size: data.size,
          filePath: data.filePath,
          thumbnailUrl: data.thumbnailUrl,
          width: data.width,
          height: data.height,
          info: {
            secure_url: data.url,
            url: data.url,
            public_id: data.fileId,
            fileId: data.fileId,
            width: data.width,
            height: data.height,
            original_filename: data.name,
          },
        }

        completedCount++
        setProgress(Math.round((completedCount / fileList.length) * 100))
        onSuccess?.(normalizedResult)
      }

      onQueuesEnd?.()
    } catch (err: any) {
      console.error('ImageKit upload error:', err)
      const message = err?.message || 'Image upload failed. Please try again.'
      onError?.(err)
      alert(message)
    } finally {
      setIsUploading(false)
      setProgress(0)
      onClose?.()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        multiple={isMultiple}
        onChange={handleFileChange}
        className="hidden"
        style={{ display: 'none' }}
      />
      {children({ open: handleOpen, isUploading, progress })}
    </>
  )
}

export default ImageKitUploadWidget
