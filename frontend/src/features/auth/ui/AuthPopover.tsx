import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../../../app/providers/useAuth'
import { validateLoginForm, validateRegisterForm } from '../../../shared/utils/validation'

export function AuthPopover() {
  const { login, register, isLoading } = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')

  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setServerError(null)
    setErrors({})
  }

  const handleClose = () => {
    setAnchorEl(null)
    setServerError(null)
    setErrors({})
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))
    setErrors({})
    setServerError(null)
  }

  const fillDemo = (demoEmail: string) => {
    setMode('signIn')
    setEmail(demoEmail)
    setPassword('password123')
    setErrors({})
    setServerError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (mode === 'signIn') {
      const formErrors = validateLoginForm(email, password)
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }

      const res = await login(email, password)
      if (res.success) {
        handleClose()
      } else {
        setServerError(res.error || 'Authentication error')
      }
    } else {
      const formErrors = validateRegisterForm(email, nickname, password)
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }

      const res = await register({ email, nickname, password })
      if (res.success) {
        handleClose()
      } else {
        setServerError(res.error || 'Registration error')
      }
    }
  }

  return (
    <>
      <Button
        variant="contained"
        size="small"
        onClick={handleOpen}
        sx={{
          bgcolor: '#f04b3a',
          color: '#fff',
          fontWeight: 800,
          fontSize: 12,
          px: 2,
          py: 0.8,
          borderRadius: 0.5,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          '&:hover': { bgcolor: '#d93b2a' },
        }}
      >
        Sign In
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: 330,
              p: 2.5,
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              border: '1px solid #30343b',
              bgcolor: '#1f2228',
              color: '#fff',
            },
          },
        }}
      >
        <Stack spacing={2} component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h2" sx={{ color: '#fff', fontSize: 14, letterSpacing: 0.5 }}>
              {mode === 'signIn' ? 'Sign In' : 'Sign Up'}
            </Typography>
            <Chip
              label={mode === 'signIn' ? 'Sign In' : 'Sign Up'}
              size="small"
              sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800, height: 20 }}
            />
          </Box>

          {serverError ? (
            <Alert severity="error" sx={{ py: 0.5, fontSize: 12 }}>
              {serverError}
            </Alert>
          ) : null}

          {/* Animated Nickname field on switching to Sign Up */}
          <Collapse in={mode === 'signUp'} timeout={250} unmountOnExit>
            <TextField
              label="Nickname"
              placeholder="e.g. ProGamer2026"
              size="small"
              fullWidth
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                if (errors.nickname) setErrors((prev) => ({ ...prev, nickname: '' }))
              }}
              error={Boolean(errors.nickname)}
              helperText={errors.nickname}
              sx={{
                '& .MuiInputBase-root': { bgcolor: '#2a2e36', color: '#fff' },
                '& .MuiInputLabel-root': { color: '#8d94a0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404550' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f04b3a' },
              }}
            />
          </Collapse>

          <TextField
            label="Email"
            type="email"
            placeholder="name@example.com"
            size="small"
            fullWidth
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
            }}
            error={Boolean(errors.email)}
            helperText={errors.email}
            sx={{
              '& .MuiInputBase-root': { bgcolor: '#2a2e36', color: '#fff' },
              '& .MuiInputLabel-root': { color: '#8d94a0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404550' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f04b3a' },
            }}
          />

          <TextField
            label="Password"
            type="password"
            placeholder="••••••••"
            size="small"
            fullWidth
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
            }}
            error={Boolean(errors.password)}
            helperText={errors.password}
            sx={{
              '& .MuiInputBase-root': { bgcolor: '#2a2e36', color: '#fff' },
              '& .MuiInputLabel-root': { color: '#8d94a0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404550' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f04b3a' },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            fullWidth
            sx={{
              bgcolor: '#f04b3a',
              color: '#fff',
              fontWeight: 800,
              py: 1,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              '&:hover': { bgcolor: '#d93b2a' },
            }}
          >
            {isLoading ? (
              <CircularProgress size={22} sx={{ color: '#fff' }} />
            ) : mode === 'signIn' ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </Button>

          <Divider sx={{ borderColor: '#333842' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#9aa0ac', fontSize: 12 }}>
              {mode === 'signIn' ? "Don't have an account?" : 'Already registered?'}
              <Button
                variant="text"
                size="small"
                onClick={toggleMode}
                sx={{
                  ml: 0.5,
                  p: 0,
                  color: '#f04b3a',
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 'auto',
                  textDecoration: 'underline',
                  '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
                }}
              >
                {mode === 'signIn' ? 'Sign Up' : 'Sign In'}
              </Button>
            </Typography>
          </Box>

          {/* Quick demo buttons for testing */}
          <Box sx={{ pt: 1, borderTop: '1px dashed #333842' }}>
            <Typography variant="caption" sx={{ color: '#7b8390', display: 'block', mb: 0.8, fontSize: 10 }}>
              Quick login for testing:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Admin"
                size="small"
                onClick={() => fillDemo('admin@tracker.local')}
                sx={{
                  bgcolor: '#303642',
                  color: '#f04b3a',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#3e4554' },
                }}
              />
              <Chip
                label="User"
                size="small"
                onClick={() => fillDemo('user@tracker.local')}
                sx={{
                  bgcolor: '#303642',
                  color: '#a7aab0',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#3e4554' },
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </Popover>
    </>
  )
}
