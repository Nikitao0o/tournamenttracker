import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface DeleteConfirmDialogProps {
  open: boolean
  title?: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ open, title, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Удаление турнира</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Вы уверены, что хотите удалить турнир <strong>{title}</strong>? Это действие нельзя отменить.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Отмена
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
