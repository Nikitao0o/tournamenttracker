import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title = 'Данные не найдены',
  description = 'По вашему запросу ничего не найдено или список пока пуст.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 400, mx: 'auto' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'grid',
            placeItems: 'center',
            fontSize: 22,
          }}
        >
          📂
        </Box>
        <Typography variant="h2" sx={{ fontSize: 16 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {description}
        </Typography>
        {actionLabel && onAction ? (
          <Button variant="outlined" onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  )
}
