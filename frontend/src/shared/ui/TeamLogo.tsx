import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { getTeamLogoData } from './teamLogosData'
import { resolveImageUrl } from '../utils/image'
import { storage } from '../api/storage'

interface TeamLogoProps {
  teamName?: string
  logoUrl?: string
  preferredFormat?: 'png' | 'jpg' | 'svg'
  size?: number
  variant?: 'circular' | 'rounded' | 'square'
  sx?: SxProps<Theme>
}

export function TeamLogo({
  teamName,
  logoUrl,
  preferredFormat,
  size = 28,
  variant = 'rounded',
  sx,
}: TeamLogoProps) {
  // 0: try custom or stored or logoUrl, 1: try PNG/JPG, 2: try SVG, 3: fallback to monogram
  const [attempt, setAttempt] = useState(0)

  // Empty placeholder slot for TBD / unassigned team
  const isTBD = !teamName || teamName.trim() === '' || teamName.toUpperCase() === 'TBD' || teamName === 'To Be Decided'

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

  const known = getTeamLogoData(teamName)
  const storedCustomLogo = storage.getTeamLogo(teamName) || (known?.short ? storage.getTeamLogo(known.short) : null)

  const getSource = (): string | undefined => {
    if (attempt === 0) {
      if (storedCustomLogo) return storedCustomLogo
      if (logoUrl) return resolveImageUrl(logoUrl)
      if (preferredFormat === 'png' && known?.png) return known.png
      if (preferredFormat === 'jpg' && known?.jpg) return known.jpg
      if (preferredFormat === 'svg' && known?.svg) return known.svg
      return known?.primaryImg || known?.svg
    }
    if (attempt === 1) {
      return known?.primaryImg || known?.svg
    }
    if (attempt === 2) {
      return known?.svg
    }
    return undefined
  }

  const effectiveSrc = getSource()
  const initial = known?.short || teamName.slice(0, 3).toUpperCase()
  const bgColor = known?.bg || '#2d3e50'
  const textColor = known?.color || '#ffffff'

  const handleError = () => {
    setAttempt((prev) => prev + 1)
  }

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
            onError: handleError,
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
