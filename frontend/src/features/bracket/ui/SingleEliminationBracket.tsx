import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { TournamentBracketView } from '../../../types'
import { BracketMatchCard } from './BracketMatchCard'

interface SingleEliminationBracketProps {
  bracket: TournamentBracketView
}

export function SingleEliminationBracket({ bracket }: SingleEliminationBracketProps) {
  const { upperBracket, allRounds, grandFinal } = bracket
  const rounds = upperBracket.length > 0 ? upperBracket : allRounds.filter((r) => r.roundName !== 'Grand final')

  return (
    <Stack spacing={4}>
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#f04b3a', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            SINGLE ELIMINATION PLAYOFFS
          </Typography>
        </Stack>

        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Stack direction="row" spacing={4} sx={{ minWidth: 'max-content', alignItems: 'center' }}>
            {/* Elimination Rounds */}
            {rounds.map((round) => (
              <Stack key={round.roundName} spacing={2} sx={{ width: 280 }}>
                <Box sx={{ pb: 0.5, borderBottom: '2px solid #282c35' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#9aa0ac', textTransform: 'uppercase' }}>
                    {round.roundName}
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  {round.matches.map((m) => (
                    <BracketMatchCard key={m.id} match={m} width="100%" />
                  ))}
                </Stack>
              </Stack>
            ))}

            {/* Grand Final Column */}
            {grandFinal ? (
              <Stack spacing={2} sx={{ width: 300 }}>
                <Box sx={{ pb: 0.5, borderBottom: '2px solid #ffb300' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#ffb300', textTransform: 'uppercase' }}>
                    Grand Final
                  </Typography>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    bgcolor: '#14161b',
                    borderColor: '#ffb300',
                    borderWidth: 1.5,
                    borderRadius: 1.5,
                  }}
                >
                  <BracketMatchCard match={grandFinal} width="100%" />
                </Paper>
              </Stack>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Stack>
  )
}
