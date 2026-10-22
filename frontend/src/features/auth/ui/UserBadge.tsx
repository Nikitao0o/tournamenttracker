import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAuth } from '../../../app/providers/useAuth'

export function UserBadge() {
  const { user, isAdmin, logout } = useAuth()

  if (!user) return null

  const initial = (user.nickname || user.email || 'U').charAt(0).toUpperCase()

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            fontSize: 12,
            fontWeight: 800,
            bgcolor: isAdmin ? '#f04b3a' : '#3d4452',
            color: '#fff',
          }}
        >
          {initial}
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {user.nickname}
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#8d94a0' }}>{user.email}</Typography>
        </Box>
        <Chip
          label={isAdmin ? 'ADMIN' : 'USER'}
          size="small"
          sx={{
            height: 18,
            fontSize: 9,
            fontWeight: 800,
            bgcolor: isAdmin ? '#f04b3a' : '#2b313d',
            color: '#fff',
          }}
        />
      </Stack>

      <Button
        variant="outlined"
        size="small"
        onClick={logout}
        sx={{
          borderColor: '#404550',
          color: '#a7aab0',
          fontSize: 11,
          fontWeight: 700,
          px: 1.5,
          py: 0.5,
          borderRadius: 0.5,
          '&:hover': {
            borderColor: '#f04b3a',
            color: '#fff',
            bgcolor: 'rgba(240, 75, 58, 0.1)',
          },
        }}
      >
        Log Out
      </Button>
    </Stack>
  )
}
