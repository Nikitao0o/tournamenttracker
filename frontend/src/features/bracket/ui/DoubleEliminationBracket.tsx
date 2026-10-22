import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { TournamentBracketView } from '../../../types'
import { BracketMatchCard } from './BracketMatchCard'

interface DoubleEliminationBracketProps {
  bracket: TournamentBracketView
}

export function DoubleEliminationBracket({ bracket }: DoubleEliminationBracketProps) {
  const { upperBracket, lowerBracket, grandFinal } = bracket

  return (
    <Stack spacing={4}>
      {/* Upper Bracket Section */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#f04b3a', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            UPPER BRACKET
          </Typography>
        </Stack>

        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Stack direction="row" spacing={4} sx={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
            {upperBracket.map((round) => (
              <Stack key={round.roundName} spacing={2} sx={{ width: 280 }}>
                <Box sx={{ pb: 0.5, borderBottom: '2px solid #282c35' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#9aa0ac', textTransform: 'uppercase' }}>
                    {round.roundName}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {round.matches.map((m) => (
                    <BracketMatchCard key={m.id} match={m} width="100%" />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Lower Bracket Section */}
      {lowerBracket.length > 0 ? (
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: 4, height: 18, bgcolor: '#ffb300', borderRadius: 0.5 }} />
            <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
              LOWER BRACKET
            </Typography>
          </Stack>

          <Box sx={{ overflowX: 'auto', pb: 2 }}>
            <Stack direction="row" spacing={4} sx={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
              {lowerBracket.map((round) => (
                <Stack key={round.roundName} spacing={2} sx={{ width: 280 }}>
                  <Box sx={{ pb: 0.5, borderBottom: '2px solid #282c35' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#9aa0ac', textTransform: 'uppercase' }}>
                      {round.roundName}
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {round.matches.map((m) => (
                      <BracketMatchCard key={m.id} match={m} width="100%" />
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      ) : null}

      {/* Grand Final Section */}
      {grandFinal ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            bgcolor: '#14161b',
            borderColor: '#ffb300',
            borderWidth: 1.5,
            borderRadius: 2,
            boxShadow: '0 0 24px rgba(255, 179, 0, 0.12)',
          }}
        >
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ fontSize: 22 }}>🏆</Box>
              <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 900, color: '#ffb300', letterSpacing: 1 }}>
                GRAND FINAL CHAMPIONSHIP
              </Typography>
            </Stack>

            <Typography sx={{ color: '#8b929e', fontSize: 12, maxWidth: 500 }}>
              The winner of the Upper Bracket faces the winner of the Lower Bracket Consolidation Final for the tournament trophy.
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 360, pt: 1 }}>
              <BracketMatchCard match={grandFinal} width="100%" />
            </Box>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  )
}
