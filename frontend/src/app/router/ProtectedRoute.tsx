import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import { CardSkeleton } from '../../shared/ui/LoadingSkeleton'
import { NotFoundPage } from '../../pages/NotFoundPage'

export function ProtectedAdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <CardSkeleton count={2} />
      </Box>
    )
  }

  // Hide the existence of admin panel from non-admins and guests completely (404)
  if (!isAuthenticated || !isAdmin) {
    return <NotFoundPage />
  }

  return <Outlet />
}
