import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import type { BracketType, TournamentBracketView, BracketMatch, Tournament, Team } from '../../types'
import { apiClient } from '../../shared/api/client'
import { getErrorMessage } from '../../shared/api/errors'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { DoubleEliminationBracket } from '../../features/bracket/ui/DoubleEliminationBracket'
import { SingleEliminationBracket } from '../../features/bracket/ui/SingleEliminationBracket'
import { RoundRobinBracket } from '../../features/bracket/ui/RoundRobinBracket'
import { SwissBracket } from '../../features/bracket/ui/SwissBracket'

const BRACKET_FORMATS: { label: string; value: BracketType; description: string }[] = [
  { label: 'Double Elimination', value: 'double_elimination', description: 'Upper and Lower brackets with Grand Final' },
  { label: 'Single Elimination', value: 'single_elimination', description: 'Classic knockout playoffs tree' },
  { label: 'Round Robin', value: 'round_robin', description: 'All-play-all circular group stage' },
  { label: 'Swiss System', value: 'swiss', description: 'Record-based rounds matching winners vs winners' },
]

export function AdminBracketEditorPage() {
  const { id } = useParams<{ id: string }>()

  const [tournamentsList, setTournamentsList] = useState<Tournament[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(id || '')
  const [bracket, setBracket] = useState<TournamentBracketView | null>(null)
  const [activeBracketType, setActiveBracketType] = useState<BracketType>('double_elimination')

  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Load initial tournaments and teams
  useEffect(() => {
    let mounted = true
    Promise.all([apiClient.getTournaments(), apiClient.getTeams()])
      .then(([tList, teams]) => {
        if (!mounted) return
        setTournamentsList(tList)
        setAvailableTeams(teams)
        const targetId = id || (tList[0]?.id ? String(tList[0].id) : '')
        setSelectedTournamentId(targetId)
        const found = tList.find((t) => String(t.id) === targetId) || tList[0]
        if (found?.bracketType) {
          setActiveBracketType(found.bracketType as BracketType)
        }
      })
      .catch((err) => {
        if (mounted) {
          setNotification(err instanceof Error ? err.message : 'Failed to load initial data')
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (!selectedTournamentId) return
    let ignore = false
    apiClient
      .getTournamentBracket(selectedTournamentId)
      .then((bView) => {
        if (!ignore) {
          setBracket(bView)
          if (bView.bracketType) {
            setActiveBracketType(bView.bracketType as BracketType)
          }
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!ignore) {
          setBracket({
            tournamentId: Number(selectedTournamentId) || 1,
            tournamentTitle: 'Tournament',
            bracketType: 'double_elimination',
            upperBracket: [],
            lowerBracket: [],
            grandFinal: null,
            allRounds: [],
          })
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [selectedTournamentId])

  const currentTournament = tournamentsList.find((t) => String(t.id) === String(selectedTournamentId))

  const handleTournamentChange = (newId: string) => {
    setSelectedTournamentId(newId)
    const tourney = tournamentsList.find((t) => String(t.id) === String(newId))
    if (tourney?.bracketType) {
      setActiveBracketType(tourney.bracketType as BracketType)
    }
  }

  const handleFormatChange = async (newFormat: BracketType) => {
    if (!selectedTournamentId) return
    setActiveBracketType(newFormat)
    setIsRegenerating(true)
    try {
      const teamIds = availableTeams.slice(0, 4).map((t) => Number(t.id))
      const freshBracket = await apiClient.generateBracket(selectedTournamentId, {
        name: currentTournament?.title || 'Tournament',
        bracket_type: newFormat,
        team_ids: teamIds,
      })
      setBracket(freshBracket)
      await apiClient.updateTournament(selectedTournamentId, { bracketType: newFormat })
      setNotification(`Bracket regenerated as ${newFormat.replace('_', ' ').toUpperCase()} on server!`)
    } catch (err: unknown) {
      setNotification(getErrorMessage(err))
    } finally {
      setIsRegenerating(false)
    }
  }

  const assignTeamToMatch = async (matchId: number | string, slot: 'A' | 'B', teamName: string) => {
    if (!bracket) return
    const teamObj = availableTeams.find((t) => t.name === teamName)
    const teamIdVal = teamName === 'TBD' ? null : (teamObj ? Number(teamObj.id) : null)

    try {
      await apiClient.updateMatch(matchId, {
        [slot === 'A' ? 'team_a_id' : 'team_b_id']: teamIdVal,
      })

      const updateMatchInGroup = (m: BracketMatch): BracketMatch => {
        if (String(m.id) === String(matchId)) {
          if (slot === 'A') {
            return {
              ...m,
              teamAName: teamName,
              teamAId: teamIdVal,
              teamALogoUrl: teamObj?.logoUrl || undefined,
            }
          } else {
            return {
              ...m,
              teamBName: teamName,
              teamBId: teamIdVal,
              teamBLogoUrl: teamObj?.logoUrl || undefined,
            }
          }
        }
        return m
      }

      const newUpper = bracket.upperBracket.map((round) => ({
        ...round,
        matches: round.matches.map(updateMatchInGroup),
      }))

      const newLower = bracket.lowerBracket.map((round) => ({
        ...round,
        matches: round.matches.map(updateMatchInGroup),
      }))

      const newAll = bracket.allRounds.map((round) => ({
        ...round,
        matches: round.matches.map(updateMatchInGroup),
      }))

      const newGrandFinal = bracket.grandFinal ? updateMatchInGroup(bracket.grandFinal) : null

      setBracket({
        ...bracket,
        upperBracket: newUpper,
        lowerBracket: newLower,
        allRounds: newAll,
        grandFinal: newGrandFinal,
      })

      setNotification(`Seeded "${teamName}" into Match #${matchId}!`)
    } catch (err: unknown) {
      setNotification(err instanceof Error ? err.message : 'Failed to seed team into match')
    }
  }

  const handleQuickRegenerate = async () => {
    if (!selectedTournamentId) return
    setIsRegenerating(true)
    try {
      const teamIds = availableTeams.slice(0, 4).map((t) => Number(t.id))
      const freshBracket = await apiClient.generateBracket(selectedTournamentId, {
        name: currentTournament?.title || 'Tournament',
        bracket_type: activeBracketType,
        team_ids: teamIds,
      })
      setBracket(freshBracket)
      setNotification('Tournament bracket regenerated and synchronized with backend!')
    } catch (err: unknown) {
      setNotification(err instanceof Error ? err.message : 'Error generating bracket')
    } finally {
      setIsRegenerating(false)
    }
  }

  const allMatchesInBracket: BracketMatch[] = bracket
    ? [
        ...bracket.upperBracket.flatMap((r) => r.matches),
        ...bracket.lowerBracket.flatMap((r) => r.matches),
        ...bracket.allRounds.flatMap((r) => r.matches),
        ...(bracket.grandFinal ? [bracket.grandFinal] : []),
      ]
    : []

  const uniqueMatches = Array.from(new Map(allMatchesInBracket.map((m) => [m.id, m])).values())

  if (isLoading && !bracket) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          bgcolor: 'secondary.main',
          color: '#fff',
          p: { xs: 2, sm: 3 },
          border: '1px solid #30343b',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { md: 'center' },
          gap: 2,
        }}
      >
        <div>
          <Breadcrumbs
            separator="/"
            aria-label="breadcrumb"
            sx={{
              color: '#fff',
              mb: 0.5,
              '& .MuiBreadcrumbs-separator': { color: '#9aa7b3' },
            }}
          >
            <MuiLink
              component={RouterLink}
              to="/admin"
              underline="hover"
              sx={{
                color: '#f04b3a',
                fontWeight: 800,
                fontSize: { xs: 18, sm: 22 },
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Admin
            </MuiLink>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 }, fontWeight: 800 }}>
              Bracket Editor
            </Typography>
          </Breadcrumbs>
          <Typography sx={{ color: '#9aa7b3', fontSize: 12 }}>
            Manage participating teams, seed brackets with drag and drop, and preview dynamic tournament elimination
          </Typography>
        </div>

        <Stack direction="row" spacing={1.5}>
          {selectedTournamentId && (
            <Button
              component={RouterLink}
              to={`/tournaments/${selectedTournamentId}`}
              variant="outlined"
              sx={{ color: '#fff', borderColor: '#4a5260' }}
            >
              View Public Bracket
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleQuickRegenerate}
            disabled={isRegenerating}
            sx={{ bgcolor: '#f04b3a', fontWeight: 800, '&:hover': { bgcolor: '#d93b2a' } }}
          >
            {isRegenerating ? 'Generating...' : 'Regenerate Bracket'}
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-tournament-label">Target Tournament</InputLabel>
              <Select
                labelId="select-tournament-label"
                value={selectedTournamentId}
                label="Target Tournament"
                onChange={(e) => handleTournamentChange(e.target.value)}
              >
                {tournamentsList.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.title} ({t.bracketType || 'double_elimination'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-bracket-format-label">Bracket Type / System</InputLabel>
              <Select
                labelId="select-bracket-format-label"
                value={activeBracketType}
                label="Bracket Type / System"
                onChange={(e) => handleFormatChange(e.target.value as BracketType)}
              >
                {BRACKET_FORMATS.map((fmt) => (
                  <MenuItem key={fmt.value} value={fmt.value}>
                    <strong>{fmt.label}</strong> — {fmt.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              position: { xs: 'static', md: 'sticky' },
              top: '5rem',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              bgcolor: '#1b1e24',
              color: '#fff',
              border: '1px solid #30343b',
            }}
          >
            <Typography variant="h2" sx={{ fontSize: 14, color: '#fff', mb: 1 }}>
              AVAILABLE TEAMS ({availableTeams.length})
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b929e', display: 'block', mb: 2 }}>
              Drag any team below and drop into a match slot on the right:
            </Typography>

            <Stack spacing={1}>
              {availableTeams.map((team) => (
                <Box
                  key={team.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', team.name)
                    setDraggedTeam(team.name)
                  }}
                  onDragEnd={() => setDraggedTeam(null)}
                  sx={{
                    p: 1.2,
                    bgcolor: '#242832',
                    borderRadius: 1,
                    border: '1px solid #3a4150',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    cursor: 'grab',
                    transition: 'all 150ms ease',
                    '&:hover': {
                      bgcolor: '#2f3542',
                      borderColor: '#f04b3a',
                      transform: 'translateX(4px)',
                    },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
                  <Box sx={{ color: '#687282', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="#687282">
                      <circle cx="2" cy="2" r="1.5" />
                      <circle cx="2" cy="7" r="1.5" />
                      <circle cx="2" cy="12" r="1.5" />
                      <circle cx="8" cy="2" r="1.5" />
                      <circle cx="8" cy="7" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  </Box>
                  <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={28} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{team.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: '#8b929e' }}>
                      #{team.ranking} in World
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #3a4150' }}>
              <Typography variant="caption" sx={{ color: '#8b929e', display: 'block', mb: 1 }}>
                Quick TBD Drop:
              </Typography>
              <Box
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', 'TBD')
                  setDraggedTeam('TBD')
                }}
                onDragEnd={() => setDraggedTeam(null)}
                sx={{
                  p: 1,
                  bgcolor: '#191b20',
                  borderRadius: 1,
                  border: '1.5px dashed #4a5260',
                  color: '#8b929e',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'grab',
                  '&:hover': { borderColor: '#f04b3a', color: '#fff' },
                }}
              >
                Drag &quot;TBD&quot; (Clear slot)
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fff' }}>
              <Typography variant="h2" sx={{ mb: 0.5 }}>
                Match Seeding Drop Slots ({uniqueMatches.length} Matches)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Drop teams onto Slot A or Slot B to seed them into this match:
              </Typography>

              {uniqueMatches.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No matches in this bracket yet. Click &quot;Regenerate Bracket&quot; above to create rounds and matches.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {uniqueMatches.map((m) => (
                    <Grid key={m.id} size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          bgcolor: 'background.default',
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: 12, color: 'text.secondary' }}>
                            Match #{m.id} • {m.roundName || 'Playoff'}
                          </Typography>
                          <Chip label={m.bracketType || 'Playoff'} size="small" sx={{ fontSize: 10, height: 20 }} />
                        </Stack>

                        <Box
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.style.borderColor = '#f04b3a'
                            e.currentTarget.style.backgroundColor = 'rgba(240, 75, 58, 0.08)'
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d0d5dd'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.style.borderColor = '#d0d5dd'
                            e.currentTarget.style.backgroundColor = 'transparent'
                            const teamName = e.dataTransfer.getData('text/plain')
                            if (teamName) assignTeamToMatch(m.id, 'A', teamName)
                          }}
                          sx={{
                            p: 1,
                            mb: 1,
                            borderRadius: 1,
                            border: '1.5px dashed #d0d5dd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 150ms ease',
                            bgcolor: draggedTeam ? 'rgba(240, 75, 58, 0.02)' : 'transparent',
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <TeamLogo teamName={m.teamAName || 'TBD'} logoUrl={m.teamALogoUrl || undefined} size={24} />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                              {m.teamAName || 'TBD (Drop team here)'}
                            </Typography>
                          </Stack>
                          {m.teamAName && m.teamAName !== 'TBD' ? (
                            <IconButton
                              size="small"
                              onClick={() => assignTeamToMatch(m.id, 'A', 'TBD')}
                              sx={{ p: 0.3, fontSize: 11 }}
                              title="Clear slot"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </IconButton>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#8b929e', fontSize: 11 }}>
                              Slot A
                            </Typography>
                          )}
                        </Box>

                        <Box
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.style.borderColor = '#f04b3a'
                            e.currentTarget.style.backgroundColor = 'rgba(240, 75, 58, 0.08)'
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d0d5dd'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.style.borderColor = '#d0d5dd'
                            e.currentTarget.style.backgroundColor = 'transparent'
                            const teamName = e.dataTransfer.getData('text/plain')
                            if (teamName) assignTeamToMatch(m.id, 'B', teamName)
                          }}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            border: '1.5px dashed #d0d5dd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 150ms ease',
                            bgcolor: draggedTeam ? 'rgba(240, 75, 58, 0.02)' : 'transparent',
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <TeamLogo teamName={m.teamBName || 'TBD'} logoUrl={m.teamBLogoUrl || undefined} size={24} />
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                              {m.teamBName || 'TBD (Drop team here)'}
                            </Typography>
                          </Stack>
                          {m.teamBName && m.teamBName !== 'TBD' ? (
                            <IconButton
                              size="small"
                              onClick={() => assignTeamToMatch(m.id, 'B', 'TBD')}
                              sx={{ p: 0.3, fontSize: 11 }}
                              title="Clear slot"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </IconButton>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#8b929e', fontSize: 11 }}>
                              Slot B
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            {bracket && (
              <Paper variant="outlined" sx={{ p: 3, bgcolor: '#17191e', color: '#fff' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
                    LIVE BRACKET VISUALIZATION ({activeBracketType.replace('_', ' ').toUpperCase()})
                  </Typography>
                  <Chip
                    label={activeBracketType.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800 }}
                  />
                </Stack>

                {activeBracketType === 'double_elimination' && <DoubleEliminationBracket bracket={bracket} />}
                {activeBracketType === 'single_elimination' && <SingleEliminationBracket bracket={bracket} />}
                {activeBracketType === 'round_robin' && <RoundRobinBracket bracket={bracket} />}
                {activeBracketType === 'swiss' && <SwissBracket bracket={bracket} />}
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={3500}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert onClose={() => setNotification(null)} severity="success" sx={{ width: '100%' }}>
            {notification}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  )
}
