import Box from '@mui/material/Box'
import { TournamentCard } from '../components/TournamentCard'
import { SectionHeader } from '../components/SectionHeader'
import { MOCK_TOURNAMENTS } from '../mock/data'

export function TournamentsPage() {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Events" />
      {MOCK_TOURNAMENTS.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </Box>
  )
}
