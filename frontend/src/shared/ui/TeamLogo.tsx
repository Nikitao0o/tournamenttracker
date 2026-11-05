import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { resolveImageUrl } from '../utils/image'

interface TeamLogoProps {
  teamName?: string
  logoUrl?: string | null
  preferredFormat?: 'png' | 'jpg' | 'svg'
  size?: number
  variant?: 'circular' | 'rounded' | 'square'
  sx?: SxProps<Theme>
}

export function TeamLogo({
  teamName,
  logoUrl,
  size = 28,
  variant = 'rounded',
  sx,
}: TeamLogoProps) {
  const [hasError, setHasError] = useState(false)
  const [prevUrl, setPrevUrl] = useState(logoUrl)

  if (prevUrl !== logoUrl) {
    setPrevUrl(logoUrl)
    setHasError(false)
  }

  const isTBD =
    !teamName ||
    teamName.trim() === '' ||
    teamName.toUpperCase() === 'TBD' ||
    teamName === 'To Be Decided'

  if (isTBD) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...sx,
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: variant === 'circular' ? '50%' : 1,
            border: '1.5px dashed #4b5262',
            bgcolor: 'rgba(255, 255, 255, 0.04)',
            color: '#7d8696',
            display: 'grid',
            placeItems: 'center',
            fontSize: Math.max(9, Math.round(size * 0.32)),
            fontWeight: 800,
            letterSpacing: 0.5,
            userSelect: 'none',
          }}
          title="TBD (Empty slot)"
        >
          ?
        </Box>
      </Box>
    )
  }

  const resolvedSrc = logoUrl && !hasError ? resolveImageUrl(logoUrl) : undefined
  const initial = teamName ? teamName.slice(0, 3).toUpperCase() : '?'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...sx,
      }}
    >
      <Avatar
        src={resolvedSrc}
        alt={teamName}
        variant={variant}
        slotProps={{
          img: {
            onError: () => setHasError(true),
            style: { objectFit: 'cover' },
          },
        }}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(9, Math.round(size * 0.36)),
          fontWeight: 800,
          bgcolor: '#2d3e50',
          color: '#ffffff',
          border: '1px solid rgba(0,0,0,0.15)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {initial}
      </Avatar>
    </Box>
  )
}
