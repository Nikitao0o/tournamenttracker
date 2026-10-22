import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

interface ErrorAlertProps {
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Повторить
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  )
}
