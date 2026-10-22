import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ImageUploadField } from '../../../shared/ui/ImageUploadField'

interface MediaUploadDialogProps {
  open: boolean
  title: string
  entityName: string
  currentValue?: string
  onClose: () => void
  onSave: (dataUrl: string) => void
  onReset?: () => void
}

export function MediaUploadDialog({
  open,
  title,
  entityName,
  currentValue,
  onClose,
  onSave,
  onReset,
}: MediaUploadDialogProps) {
  const [selectedImage, setSelectedImage] = useState(currentValue || '')

  const handleSave = () => {
    onSave(selectedImage)
    onClose()
  }

  const handleResetToDefault = () => {
    setSelectedImage('')
    if (onReset) onReset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 1.5 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 15 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 3 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Объект: <strong>{entityName}</strong>
          </Typography>

          <ImageUploadField
            label="Файл изображения (.PNG или .JPG):"
            value={selectedImage}
            onChange={setSelectedImage}
            helperText="Поддерживаются файлы PNG и JPG/JPEG до 5 МБ"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        {onReset ? (
          <Button size="small" color="inherit" onClick={handleResetToDefault} sx={{ mr: 'auto', fontSize: 11 }}>
            Сбросить на дефолт
          </Button>
        ) : null}
        <Button size="small" variant="outlined" color="inherit" onClick={onClose}>
          Отмена
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!selectedImage}
          onClick={handleSave}
          sx={{
            bgcolor: '#f04b3a',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: '#d93b2a' },
          }}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
