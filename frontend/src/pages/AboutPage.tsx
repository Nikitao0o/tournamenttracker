import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function AboutPage() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="h1">About Tournament Tracker</Typography>
      <Typography color="text.secondary">
        Tournament Tracker is a fullstack web platform for following Counter-Strike 2 tournaments,
        brackets, teams, and matches with comprehensive HLTV-style player statistics.
      </Typography>
      <Typography color="text.secondary">
        Use the header navigation to browse live and upcoming matches, explore tournament brackets
        (Double Elimination, Single Elimination, Round Robin, Swiss), inspect team rosters, and track
        world player leaderboards.
      </Typography>
    </Stack>
  )
}
