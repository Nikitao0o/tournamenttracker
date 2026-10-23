import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import { CardSkeleton } from '../../shared/ui/LoadingSkeleton'

export function ProtectedAdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <CardSkeleton count={2} />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return (
      <Paper variant="outlined" sx={{ p: 4, my: 4, textAlign: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 460, mx: 'auto' }}>
          <Typography variant="h1">Administrator Authorization Required</Typography>
          <Typography color="text.secondary">
            Access to the tournament management panel is restricted to administrator accounts. Please sign in via the
            <strong> Sign In</strong> button in the header.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: 'background.default', p: 1, border: '1px solid', borderColor: 'divider' }}>
            For testing use: <strong>admin@tracker.local</strong> / <strong>password123</strong>
          </Typography>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 1 }}>
            Return to Home
          </Button>
        </Stack>
      </Paper>
    )
  }

  if (!isAdmin) {
    return (
      <Paper variant="outlined" sx={{ p: 4, my: 4, textAlign: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 460, mx: 'auto' }}>
          <Typography variant="h1">Access Denied (403)</Typography>
          <Typography color="text.secondary">
            You are signed in as a regular user. This section is restricted to tournament administrators and organizers.
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Back to Matches
          </Button>
        </Stack>
      </Paper>
    )
  }

  return <Outlet />
}
