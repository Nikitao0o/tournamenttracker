import Box from '@mui/material/Box'
import { TournamentCard } from '../components/TournamentCard'
import { SectionHeader } from '../components/SectionHeader'
import { getTournaments } from '../api/client'
import { useApi } from '../api/useApi'
import { ApiState } from '../components/ApiState'

export function TournamentsPage() {
  const { data, loading, error } = useApi(getTournaments)
  if (loading || error) return <ApiState loading={loading} error={error} />
  if (!data) return null

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Events" />
      {data.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </Box>
  )
}
