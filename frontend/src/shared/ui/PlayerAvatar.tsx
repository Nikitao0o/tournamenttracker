import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { resolveImageUrl } from '../utils/image'

interface PlayerAvatarProps {
  name?: string
  avatarUrl?: string | null
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
  const [prevUrl, setPrevUrl] = useState(avatarUrl)

  if (prevUrl !== avatarUrl) {
    setPrevUrl(avatarUrl)
    setHasError(false)
  }

  const isEmptySlot =
    !name ||
    name.trim() === '' ||
    name.toUpperCase() === 'TBD' ||
    name === 'Unassigned' ||
    name === 'Open Slot'

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
            userSelect: 'none',
          }}
          title="Empty player slot"
        >
          <svg
            width={Math.round(size * 0.55)}
            height={Math.round(size * 0.55)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </Box>
      </Box>
    )
  }

  const resolvedSrc = avatarUrl && !hasError ? resolveImageUrl(avatarUrl) : undefined

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
        src={resolvedSrc}
        alt={name}
        slotProps={{
          img: {
            onError: () => setHasError(true),
            style: { objectFit: 'cover' },
          },
        }}
        sx={{
          width: size,
          height: size,
          bgcolor: '#242832',
          color: '#8a93a4',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          fontSize: Math.max(10, Math.round(size * 0.38)),
          fontWeight: 700,
        }}
      >
        <svg
          width={Math.round(size * 0.55)}
          height={Math.round(size * 0.55)}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </Avatar>
    </Box>
  )
}
