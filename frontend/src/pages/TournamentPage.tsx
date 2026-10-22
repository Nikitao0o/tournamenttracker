import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { useTournaments } from '../app/providers/useTournaments'
import { MatchList } from '../components/MatchList'
import { TournamentStatusLabel } from '../components/StatusChips'
import { getMatchesByTournamentId, getTournamentById } from '../mock/data'
import { apiClient } from '../shared/api/client'
import type { TournamentBracketView as BracketViewType } from '../types'
import { formatDate } from '../utils/formatting'
import { TournamentBracketView } from '../features/bracket/ui/TournamentBracketView'

export function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const { getTournament } = useTournaments()
  const [activeTab, setActiveTab] = useState<'bracket' | 'matches'>('bracket')
  const [bracket, setBracket] = useState<BracketViewType | null>(null)
  const [isBracketLoading, setIsBracketLoading] = useState(true)

  // Look first in dynamic provider (includes tournaments created in admin), then in mocks
  const tournament = id ? (getTournament(id) || getTournamentById(id)) : undefined
  const matches = id ? getMatchesByTournamentId(id) : []

  useEffect(() => {
    let active = true
    if (!id) return

    setIsBracketLoading(true)
    apiClient
      .getTournamentBracket(id)
      .then((data) => {
        if (active) {
          setBracket(data)
          setIsBracketLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setIsBracketLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id, tournament?.bracketType])

  if (!tournament) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Tournament not found</Typography>
        <Button component={Link} to="/tournaments" variant="outlined">
          Back to tournaments
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/tournaments" sx={{ alignSelf: 'flex-start' }}>
        ← Tournaments
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h1" sx={{ mr: 1 }}>
              {tournament.title}
            </Typography>
            <TournamentStatusLabel status={tournament.status} />
          </Stack>
          <Typography color="text.secondary">{tournament.location}</Typography>
          <Typography sx={{ fontWeight: 600 }}>Prize pool {tournament.prizePool}</Typography>
          <Typography color="text.secondary">
            {formatDate(tournament.startDate)} — {formatDate(tournament.endDate)}
          </Typography>
          {tournament.bracketType ? (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Bracket Format: {tournament.bracketType}
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      {/* View switcher tabs: Bracket vs All Matches */}
      <Box sx={{ borderBottom: '1px solid #2d323b' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTabs-indicator': { bgcolor: '#f04b3a', height: 3 },
            '& .MuiTab-root': {
              color: '#8b929e',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 0.5,
              '&.Mui-selected': { color: '#fff' },
            },
          }}
        >
          <Tab value="bracket" label="📊 TOURNAMENT BRACKET" />
          <Tab value="matches" label="⚔️ ALL MATCHES" />
        </Tabs>
      </Box>

      {activeTab === 'bracket' ? (
        <TournamentBracketView bracket={bracket} isLoading={isBracketLoading} />
      ) : (
        <div>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            Matches
          </Typography>
          <MatchList matches={matches} emptyText="No demo matches for this event yet." />
        </div>
      )}
    </Stack>
  )
}
