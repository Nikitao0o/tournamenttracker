import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { ErrorBoundary } from '../shared/ui/ErrorBoundary'
import { PageSkeleton } from '../shared/ui/LoadingSkeleton'

export function MainLayout() {
  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />

      <Box component="main" sx={{ flex: 1, py: { xs: 1.5, md: 2 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1100, px: { xs: 1, sm: 2 } }}>
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          bgcolor: 'secondary.main',
          color: '#9aa7b3',
          py: 1.5,
          mt: 2,
          textAlign: 'center',
          fontSize: 11,
        }}
      >
        Tournament Tracker · CS2 Esports Portal · {new Date().getFullYear()}
      </Box>
    </Box>
  )
}
