import Box from '@mui/material/Box'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../app/providers/useAuth'
import { AuthPopover } from '../features/auth/ui/AuthPopover'
import { UserBadge } from '../features/auth/ui/UserBadge'

export default function Header() {
  const { isAuthenticated, isAdmin } = useAuth()

  const navItems = [
    { label: 'MATCHES', href: '/', end: true },
    { label: 'TOURNAMENTS', href: '/tournaments' },
    { label: 'TEAMS', href: '/teams' },
    { label: 'PLAYERS', href: '/players' },
    { label: 'ABOUT', href: '/about' },
  ]

  // Добавляем вкладку ADMIN только если пользователь зашел под аккаунтом администратора
  if (isAdmin) {
    navItems.push({ label: 'ADMIN', href: '/admin', end: false })
  }

  return (
    <Box
      component="header"
      sx={{
        width: '100%',
        borderBottom: '1px solid #30343b',
        bgcolor: '#17191e',
        color: '#fff',
        boxShadow: 3,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          display: 'flex',
          maxWidth: 1100,
          alignItems: 'center',
          gap: { xs: 1, sm: 2.5 },
          px: { xs: 1, sm: 2 },
          py: 0.5,
        }}
      >
        {/* Логотип */}
        <Box
          component={Link}
          to="/"
          aria-label="Tournament Tracker home"
          sx={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            gap: 1,
            py: 1.5,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              width: 32,
              height: 32,
              placeItems: 'center',
              borderRadius: 1,
              bgcolor: '#f04b3a',
              fontSize: 14,
              fontWeight: 900,
              fontStyle: 'italic',
            }}
          >
            T
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: { xs: 14, sm: 18 },
              fontWeight: 800,
              letterSpacing: '-0.025em',
              whiteSpace: 'nowrap',
            }}
          >
            TOURNAMENT<Box component="span" sx={{ color: '#f04b3a' }}>TRACKER</Box>
          </Box>
        </Box>

        {/* Навигация */}
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: 'flex',
            minWidth: 0,
            flex: 1,
            alignItems: 'center',
            overflowX: 'auto',
          }}
        >
          {navItems.map((item) => {
            const isAdminItem = item.label === 'ADMIN'
            return (
              <Box
                key={item.href}
                component={NavLink}
                to={item.href}
                end={item.end}
                sx={{
                  px: { xs: 1, sm: 1.5 },
                  py: 2,
                  borderBottom: '2px solid transparent',
                  color: isAdminItem ? '#f04b3a' : '#a7aab0',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms, border-color 150ms, background-color 150ms',
                  '&.active': {
                    borderBottomColor: '#f04b3a',
                    color: '#fff',
                  },
                  '&:hover': {
                    borderBottomColor: '#f04b3a',
                    color: '#fff',
                  },
                }}
              >
                {isAdminItem ? `⚡ ${item.label}` : item.label}
              </Box>
            )
          })}
        </Box>

        {/* Блок авторизации / профиля пользователя */}
        <Box sx={{ flexShrink: 0, ml: 'auto' }}>
          {isAuthenticated ? <UserBadge /> : <AuthPopover />}
        </Box>
      </Box>
    </Box>
  )
}
