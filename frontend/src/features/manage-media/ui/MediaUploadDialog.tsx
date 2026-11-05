import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ImageUploadField } from '../../../shared/ui/ImageUploadField'
import { getErrorMessage } from '../../../shared/api/errors'

interface MediaUploadDialogProps {
  open: boolean
  title: string
  entityName: string
  currentValue?: string
  onClose: () => void
  onSave: (dataUrl: string) => Promise<void> | void
  onReset?: () => Promise<void> | void
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevVal, setPrevVal] = useState(currentValue)

  if (open !== prevOpen || currentValue !== prevVal) {
    setPrevOpen(open)
    setPrevVal(currentValue)
    setSelectedImage(currentValue || '')
    setErrorMsg(null)
    setIsSubmitting(false)
  }

  const handleSave = async () => {
    if (!selectedImage) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onSave(selectedImage)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetToDefault = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      setSelectedImage('')
      if (onReset) await onReset()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 1.5 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 15 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 3 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ fontSize: 12 }}>
              {errorMsg}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            Target: <strong>{entityName}</strong>
          </Typography>

          <ImageUploadField
            label="Image file (.PNG, .JPG, .WEBP):"
            value={selectedImage}
            onChange={setSelectedImage}
            helperText="Supports PNG, JPG, WEBP up to 5 MB"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        {onReset ? (
          <Button
            size="small"
            color="inherit"
            disabled={isSubmitting}
            onClick={handleResetToDefault}
            sx={{ mr: 'auto', fontSize: 11 }}
          >
            Reset to default
          </Button>
        ) : null}
        <Button size="small" variant="outlined" color="inherit" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!selectedImage || isSubmitting}
          onClick={handleSave}
          startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{
            bgcolor: '#f04b3a',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: '#d93b2a' },
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
