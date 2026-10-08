import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        bgcolor: 'secondary.main',
        color: '#fff',
        px: 1.25,
        py: 0.75,
        minHeight: 32,
      }}
    >
      <Typography variant="h2" sx={{ color: '#fff', m: 0 }}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}
