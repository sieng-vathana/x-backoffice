import React, { useEffect, useId, useRef, useState } from 'react'
import { resolveImageUrl } from '../lib/api'

interface ImagePickerProps {
  label: string
  imageUrl?: string
  selectedFile: File | null
  onSelectFile: (file: File | null) => void
  disabled?: boolean
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  imageUrl,
  selectedFile,
  onSelectFile,
  disabled = false,
}) => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setFilePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(selectedFile)
    setFilePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const previewUrl = filePreviewUrl || resolveImageUrl(imageUrl)

  useEffect(() => {
    setImageFailed(false)
  }, [previewUrl])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setValidationError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setValidationError('Choose an image smaller than 5 MB.')
      return
    }
    setValidationError('')
    onSelectFile(file)
  }

  return (
    <div>
      <label className="text-xs font-medium text-zinc-700 block mb-1.5" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white flex items-center justify-center">
          {previewUrl && !imageFailed ? (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <i className="ri-image-line text-2xl text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled}
              onChange={handleChange}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              {selectedFile ? 'Choose another' : imageUrl ? 'Change image' : 'Select image'}
            </button>
            {(imageUrl || selectedFile) && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setValidationError('')
                  onSelectFile(null)
                }}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">
            JPG, PNG, or WebP up to 5 MB. The image uploads when you save.
          </p>
          {selectedFile && <p className="mt-1 truncate text-[11px] text-zinc-600">{selectedFile.name}</p>}
        </div>
      </div>
      {validationError && <p className="mt-1.5 text-[11px] text-rose-600">{validationError}</p>}
    </div>
  )
}
