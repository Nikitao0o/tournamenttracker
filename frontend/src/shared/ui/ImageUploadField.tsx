import { useState, useRef, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { fileToDataUrl, validateImageFile } from '../utils/image'

interface ImageUploadFieldProps {
  label: string
  value?: string
  onChange: (dataUrl: string) => void
  onClear?: () => void
  helperText?: string
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onClear,
  helperText,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Ошибка валидации файла')
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      onChange(dataUrl)
    } catch {
      setError('Не удалось прочитать файл изображения')
    }
  }

  const handleClear = () => {
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onClear) {
      onClear()
    } else {
      onChange('')
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.8, color: 'text.primary' }}>
        {label}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        {/* Превью изображения */}
        {value ? (
          <Box
            sx={{
              position: 'relative',
              width: 56,
              height: 56,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={value}
              alt="Preview"
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={handleClear}
              aria-label="Удалить изображение"
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                p: 0.2,
                '&:hover': { bgcolor: 'rgba(240,75,58,0.9)' },
              }}
            >
              ✕
            </IconButton>
          </Box>
        ) : null}

        {/* Кнопка выбора файла */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.8 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{ fontSize: 12, fontWeight: 700 }}
            >
              {value ? 'Заменить файл (PNG / JPG)' : 'Выбрать PNG или JPG'}
            </Button>
            <Chip label=".PNG" size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
            <Chip label=".JPG" size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
            <Chip label=".SVG" size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700 }} />
          </Stack>
        </div>
      </Stack>

      {error ? (
        <FormHelperText error sx={{ mt: 0.5 }}>
          {error}
        </FormHelperText>
      ) : helperText ? (
        <FormHelperText sx={{ mt: 0.5 }}>{helperText}</FormHelperText>
      ) : (
        <FormHelperText sx={{ mt: 0.5 }}>
          Поддерживаются форматы PNG, JPG/JPEG до 5 МБ
        </FormHelperText>
      )}
    </Box>
  )
}
