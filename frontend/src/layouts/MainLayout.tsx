import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Matches', end: true },
  { to: '/tournaments', label: 'Events' },
  { to: '/about', label: 'About' },
]

export function MainLayout() {
  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar
          sx={{
            minHeight: { xs: 48, sm: 52 },
            px: { xs: 1, sm: 2 },
            gap: 2,
            maxWidth: 1100,
            width: '100%',
            mx: 'auto',
          }}
        >
          <Typography
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: -0.6,
              fontStyle: 'italic',
              mr: 1,
            }}
          >
            TRACKER
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'stretch', height: 52, ml: 1 }}>
            {navItems.map((item) => (
              <Box
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  color: '#d5dde4',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  '&.active': {
                    color: '#fff',
                    boxShadow: 'inset 0 -3px 0 #eb6b22',
                  },
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, py: { xs: 1.5, md: 2 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1100, px: { xs: 1, sm: 2 } }}>
          <Outlet />
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
        Demo frontend · mock data · not affiliated with HLTV.org · {new Date().getFullYear()}
      </Box>
    </Box>
  )
}
