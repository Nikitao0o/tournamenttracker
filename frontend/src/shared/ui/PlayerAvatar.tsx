import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { getKnownPlayerAvatar } from './playerAvatarsData'
import { resolveImageUrl } from '../utils/image'
import { storage } from '../api/storage'

// Identical default avatar icon for any player without a unique avatar
export const DEFAULT_PLAYER_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="50" fill="%23242832"/>
  <circle cx="50" cy="50" r="48" fill="none" stroke="%233a4150" stroke-width="2"/>
  <path d="M30 42 C30 24 70 24 70 42" fill="none" stroke="%23f04b3a" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="25" y="38" width="8" height="16" rx="3" fill="%23f04b3a"/>
  <rect x="67" y="38" width="8" height="16" rx="3" fill="%23f04b3a"/>
  <circle cx="50" cy="42" r="16" fill="%238a93a4"/>
  <path d="M24 86 C26 66 38 60 50 60 C62 60 74 66 76 86 Z" fill="%238a93a4"/>
</svg>`

interface PlayerAvatarProps {
  name?: string
  avatarUrl?: string
  teamId?: string
  preferredFormat?: 'png' | 'jpg' | 'svg'
  size?: number
  role?: string
  sx?: SxProps<Theme>
}

export function PlayerAvatar({
  name,
  avatarUrl,
  size = 36,
  sx,
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false)

  // Empty placeholder slot for unassigned player
  const isEmptySlot = !name || name.trim() === '' || name.toUpperCase() === 'TBD' || name === 'Unassigned' || name === 'Open Slot'

  if (isEmptySlot) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          ...sx,
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1.5px dashed #4b5262',
            bgcolor: 'rgba(255, 255, 255, 0.04)',
            color: '#7d8696',
            display: 'grid',
            placeItems: 'center',
            fontSize: Math.max(10, Math.round(size * 0.34)),
            fontWeight: 800,
            userSelect: 'none',
          }}
          title="Empty player slot"
        >
          <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </Box>
      </Box>
    )
  }

  const storedCustomAvatar = storage.getPlayerAvatar(name)
  const knownPath = getKnownPlayerAvatar(name)

  const getSource = (): string => {
    if (hasError) return DEFAULT_PLAYER_AVATAR
    if (storedCustomAvatar) return storedCustomAvatar
    if (avatarUrl) {
      const resolved = resolveImageUrl(avatarUrl)
      if (resolved) return resolved
    }
    if (knownPath) return knownPath
    return DEFAULT_PLAYER_AVATAR
  }

  const effectiveSrc = getSource()

  const handleError = () => {
    setHasError(true)
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        ...sx,
      }}
    >
      <Avatar
        src={effectiveSrc}
        alt={name}
        slotProps={{
          img: {
            onError: handleError,
            style: { objectFit: 'cover' },
          },
        }}
        sx={{
          width: size,
          height: size,
          bgcolor: '#242832',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <Box
          component="img"
          src={DEFAULT_PLAYER_AVATAR}
          alt={name}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Avatar>
    </Box>
  )
}
