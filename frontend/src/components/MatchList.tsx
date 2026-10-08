import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Match } from '../types'
import { MatchRow } from './MatchRow'
import { SectionHeader } from './SectionHeader'

type MatchListProps = {
  title?: string
  matches: Match[]
  emptyText?: string
}

export function MatchList({ title, matches, emptyText = 'No matches yet.' }: MatchListProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      {title ? <SectionHeader title={title} /> : null}
      {matches.length === 0 ? (
        <Typography sx={{ px: 1.5, py: 1.5, fontSize: 13, color: 'text.secondary' }}>
          {emptyText}
        </Typography>
      ) : (
        matches.map((match) => <MatchRow key={match.id} match={match} />)
      )}
    </Box>
  )
}
