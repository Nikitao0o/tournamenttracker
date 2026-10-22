import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={18} />
            <Skeleton variant="rectangular" width="100%" height={32} sx={{ mt: 1 }} />
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}

export function TableRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={52} sx={{ width: '100%' }} />
      ))}
    </Stack>
  )
}
