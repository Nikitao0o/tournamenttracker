import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { getTeamLogoData } from './teamLogosData'

interface TeamLogoProps {
  teamName: string
  logoUrl?: string
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
  const [imgError, setImgError] = useState(false)
  const known = getTeamLogoData(teamName)

  const effectiveSrc = !imgError ? (logoUrl || known?.svg) : undefined
  const initial = known?.short || teamName.slice(0, 3).toUpperCase()
  const bgColor = known?.bg || '#2d3e50'
  const textColor = known?.color || '#ffffff'

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
        src={effectiveSrc}
        alt={teamName}
        variant={variant}
        slotProps={{
          img: {
            onError: () => setImgError(true),
            style: { objectFit: 'cover' },
          },
        }}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(9, Math.round(size * 0.36)),
          fontWeight: 800,
          bgcolor: bgColor,
          color: textColor,
          border: '1px solid rgba(0,0,0,0.15)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {initial}
      </Avatar>
    </Box>
  )
}
