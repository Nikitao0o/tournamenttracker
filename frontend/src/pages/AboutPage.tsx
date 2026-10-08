import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function AboutPage() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="h1">About</Typography>
      <Typography color="text.secondary">
        Tournament Tracker is a frontend prototype for following Counter-Strike matches
        and tournaments. Layout, routing, and UI components are in place; match data on
        this build is mocked and does not come from a live API.
      </Typography>
      <Typography color="text.secondary">
        Use the header to open the match feed, browse events, and open a single match or
        tournament page. Filters on the home page only change what is shown from the
        local demo list.
      </Typography>
    </Stack>
  )
}
