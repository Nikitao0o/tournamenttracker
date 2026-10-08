import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ py: 6, alignItems: 'flex-start' }}>
      <Typography variant="h1">404 — page not found</Typography>
      <Typography color="text.secondary">
        This URL is not part of the demo app.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Go to matches
      </Button>
    </Stack>
  )
}
