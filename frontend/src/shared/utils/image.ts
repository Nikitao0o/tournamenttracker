export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'] as const
export const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function isSupportedImage(urlOrFileName: string): boolean {
  if (!urlOrFileName) return false
  const lower = urlOrFileName.toLowerCase().trim()
  if (lower.startsWith('data:image/png') || lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/jpg')) {
    return true
  }
  return SUPPORTED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext) || lower.includes(`${ext}?`))
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
  const isMimeValid = (SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type)
  const isExtValid = (SUPPORTED_IMAGE_EXTENSIONS as readonly string[]).includes(extension)

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Неподдерживаемый формат изображения. Допустимы файлы: .PNG, .JPG, .JPEG, .SVG, .WEBP',
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Размер файла превышает допустимый лимит (максимум 5 МБ)',
    }
  }

  return { valid: true }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Не удалось прочитать файл изображения'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return trimmed
  }
  return `/images/${trimmed}`
}
