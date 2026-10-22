import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

// Basic color palettes for player avatars based on team/role
const TEAM_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  'team-spirit': { bg: '#1c222b', accent: '#69f0ae', text: '#ffffff' },
  'team-vitality': { bg: '#2b291a', accent: '#ffd700', text: '#ffffff' },
  'team-furia': { bg: '#231d20', accent: '#f04b3a', text: '#ffffff' },
  'team-mouz': { bg: '#2b171a', accent: '#e30613', text: '#ffffff' },
}

// Generate SVG player avatar wearing esports headset
function generatePlayerSvg(name: string, teamId?: string): string {
  const team = teamId ? TEAM_COLORS[teamId] : { bg: '#23272e', accent: '#f04b3a', text: '#ffffff' }
  const bg = team?.bg || '#23272e'
  const accent = team?.accent || '#f04b3a'
  const initial = name.charAt(0).toUpperCase()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="50" fill="${encodeURIComponent(bg)}"/>
    <!-- Headset headband -->
    <path d="M22 50 C22 25 78 25 78 50" fill="none" stroke="${encodeURIComponent(accent)}" stroke-width="6" stroke-linecap="round"/>
    <!-- Headset earcups -->
    <rect x="16" y="44" width="10" height="18" rx="4" fill="${encodeURIComponent(accent)}"/>
    <rect x="74" y="44" width="10" height="18" rx="4" fill="${encodeURIComponent(accent)}"/>
    <!-- Head silhouette -->
    <circle cx="50" cy="50" r="22" fill="%23ffffff" fill-opacity="0.9"/>
    <!-- Jersey shoulders -->
    <path d="M24 92 C28 72 72 72 76 92 Z" fill="${encodeURIComponent(accent)}"/>
    <!-- Initial letter -->
    <text x="50" y="56" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="%2317191e" text-anchor="middle">${initial}</text>
  </svg>`

  return `data:image/svg+xml;utf8,${svg}`
}

interface PlayerAvatarProps {
  name: string
  avatarUrl?: string
  teamId?: string
  size?: number
  role?: string
  sx?: SxProps<Theme>
}

export function PlayerAvatar({
  name,
  avatarUrl,
  teamId,
  size = 36,
  sx,
}: PlayerAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const fallbackSvg = generatePlayerSvg(name, teamId)
  const effectiveSrc = !imgError ? (avatarUrl || fallbackSvg) : fallbackSvg
  const initial = name.charAt(0).toUpperCase()

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
            onError: () => setImgError(true),
          },
        }}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(10, Math.round(size * 0.38)),
          fontWeight: 800,
          bgcolor: 'secondary.main',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {initial}
      </Avatar>
    </Box>
  )
}
