import { useEffect, useRef } from 'react'

import { useDropzone } from 'react-dropzone'

import { PlusIcon } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

export type StudyDropzoneProps = {
  categoryId: string
  color?: string
}

const StudyDropzone = ({
  categoryId,
  color = 'hsla(var(--primary-bg))',
}: StudyDropzoneProps) => {
  const zoneRef = useRef<HTMLDivElement | null>(null)
  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    noClick: true,
    multiple: false,
    onDrop: (files) => {
      const file = files[0]
      if (file) {
        const withPath = file as unknown as { path?: string }
        window.electronAPI?.IMPORT_FILE?.({
          filePath: withPath.path || '',
          categoryId,
        })
      }
    },
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        zoneRef.current?.focus()
        open()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div
      {...getRootProps({
        tabIndex: 0,
        ref: zoneRef,
        className: twMerge(
          'fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[hsla(var(--app-bg))] text-[hsla(var(--text-primary))] focus:outline-none',
          isDragActive && 'shadow-[0_0_0_4px_var(--category-color)]'
        ),
        style: isDragActive ? { boxShadow: `0 0 0 4px ${color}` } : undefined,
      })}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <span className="text-xs font-semibold">Drop to Study</span>
      ) : (
        <PlusIcon size={24} />
      )}
    </div>
  )
}

export default StudyDropzone
