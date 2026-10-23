import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import type { BracketType, TournamentBracketView, BracketMatch, Tournament } from '../../types'
import { MOCK_TOURNAMENTS, MOCK_TEAMS, getMockBracketForTournament } from '../../mock/data'
import { generateDynamicBracket } from '../../features/bracket/utils/bracketGenerator'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { storage } from '../../shared/api/storage'
import { DoubleEliminationBracket } from '../../features/bracket/ui/DoubleEliminationBracket'
import { SingleEliminationBracket } from '../../features/bracket/ui/SingleEliminationBracket'

const BRACKET_FORMATS: { label: string; value: BracketType; description: string }[] = [
  { label: 'Double Elimination', value: 'double_elimination', description: 'Upper and Lower brackets with Grand Final' },
  { label: 'Single Elimination', value: 'single_elimination', description: 'Classic knockout playoffs tree' },
]

export function AdminBracketEditorPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentsList = storage.getTournaments() || MOCK_TOURNAMENTS
  const availableTeams = storage.getTeams() || MOCK_TEAMS
  const initialTourney = tournamentsList.find((t) => t.id === id) || tournamentsList[0] || MOCK_TOURNAMENTS[0]

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(initialTourney.id)
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null)
  const [teamToAdd, setTeamToAdd] = useState<string>('')
  const [notification, setNotification] = useState<string | null>(null)

  const currentTournament = tournamentsList.find((t) => t.id === selectedTournamentId) || initialTourney
  const tourneyTeams = currentTournament.participatingTeams ?? []

  // Load custom stored bracket or fallback to dynamic generated bracket
  const [bracket, setBracket] = useState<TournamentBracketView>(() => {
    const stored = storage.getTournamentBracket(selectedTournamentId)
    if (stored) return stored
    return getMockBracketForTournament(currentTournament)
  })

  const [activeBracketType, setActiveBracketType] = useState<BracketType>(
    (currentTournament.bracketType as BracketType) === 'single_elimination' ? 'single_elimination' : 'double_elimination',
  )

  const handleTournamentChange = (newId: string) => {
    setSelectedTournamentId(newId)
    const tourney = tournamentsList.find((t) => t.id === newId) || initialTourney
    const stored = storage.getTournamentBracket(newId)
    const format = (tourney.bracketType as BracketType) === 'single_elimination' ? 'single_elimination' : 'double_elimination'
    setActiveBracketType(format)

    if (stored) {
      setBracket(stored)
    } else {
      const generated = getMockBracketForTournament(tourney)
      setBracket(generated)
    }
  }

  const handleFormatChange = (newFormat: BracketType) => {
    setActiveBracketType(newFormat)
    const updated = generateDynamicBracket(
      selectedTournamentId,
      currentTournament.title,
      newFormat,
      tourneyTeams,
    )
    setBracket(updated)
    storage.setTournamentBracket(selectedTournamentId, updated)
    setNotification(`Bracket regenerated as ${newFormat.replace('_', ' ').toUpperCase()}!`)
  }

  // Add existing team to tournament and dynamically expand bracket
  const handleAddTeamToTournament = () => {
    if (!teamToAdd || tourneyTeams.includes(teamToAdd)) return

    const updatedTeams = [...tourneyTeams, teamToAdd]
    const updatedTourney: Tournament = {
      ...currentTournament,
      participatingTeams: updatedTeams,
    }

    const updatedTournaments = tournamentsList.map((t) => (t.id === selectedTournamentId ? updatedTourney : t))
    storage.setTournaments(updatedTournaments)

    const newBracket = generateDynamicBracket(
      selectedTournamentId,
      currentTournament.title,
      activeBracketType,
      updatedTeams,
    )
    setBracket(newBracket)
    storage.setTournamentBracket(selectedTournamentId, newBracket)

    setTeamToAdd('')
    const roundName = newBracket.upperBracket.length ? newBracket.upperBracket[0].roundName : 'Final'
    setNotification(`Added "${teamToAdd}" to tournament! Bracket updated (${roundName}).`)
  }

  // Remove team from tournament and adjust bracket
  const handleRemoveTeamFromTournament = (teamName: string) => {
    const updatedTeams = tourneyTeams.filter((t) => t !== teamName)
    const updatedTourney: Tournament = {
      ...currentTournament,
      participatingTeams: updatedTeams,
    }

    const updatedTournaments = tournamentsList.map((t) => (t.id === selectedTournamentId ? updatedTourney : t))
    storage.setTournaments(updatedTournaments)

    const newBracket = generateDynamicBracket(
      selectedTournamentId,
      currentTournament.title,
      activeBracketType,
      updatedTeams,
    )
    setBracket(newBracket)
    storage.setTournamentBracket(selectedTournamentId, newBracket)

    setNotification(`Removed "${teamName}" from tournament!`)
  }

  // Drag and drop assignment to match slots
  const assignTeamToMatch = (matchId: number | string, slot: 'A' | 'B', teamName: string) => {
    const updateMatchInGroup = (m: BracketMatch): BracketMatch => {
      if (String(m.id) === String(matchId)) {
        if (slot === 'A') {
          return { ...m, teamAName: teamName, teamAId: teamName === 'TBD' ? null : 99 }
        } else {
          return { ...m, teamBName: teamName, teamBId: teamName === 'TBD' ? null : 99 }
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

    const updatedBracket: TournamentBracketView = {
      ...bracket,
      upperBracket: newUpper,
      lowerBracket: newLower,
      allRounds: newAll,
      grandFinal: newGrandFinal,
    }

    setBracket(updatedBracket)
    setNotification(`Seeded "${teamName}" into Match #${matchId}!`)
  }

  const handleSaveBracket = () => {
    storage.setTournamentBracket(selectedTournamentId, bracket)
    setNotification('Tournament bracket saved successfully!')
  }

  // All matches for slot drop areas
  const allMatchesInBracket: BracketMatch[] = [
    ...bracket.upperBracket.flatMap((r) => r.matches),
    ...bracket.lowerBracket.flatMap((r) => r.matches),
    ...bracket.allRounds.flatMap((r) => r.matches),
    ...(bracket.grandFinal ? [bracket.grandFinal] : []),
  ]

  // Unique list of matches
  const uniqueMatches = Array.from(new Map(allMatchesInBracket.map((m) => [m.id, m])).values())

  return (
    <Stack spacing={3}>
      {/* Header bar */}
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
          <Button component={RouterLink} to={`/tournaments/${selectedTournamentId}`} variant="outlined" sx={{ color: '#fff', borderColor: '#4a5260' }}>
            View Public Bracket
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveBracket}
            sx={{ bgcolor: '#f04b3a', fontWeight: 800, '&:hover': { bgcolor: '#d93b2a' } }}
          >
            Save Bracket
          </Button>
        </Stack>
      </Box>

      {/* Selectors for tournament and bracket format */}
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

      {/* Section: Add and Manage Teams in Tournament */}
      <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fff' }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 1.5 }}>
            <div>
              <Typography variant="h2" sx={{ fontSize: 16 }}>
                Teams in Tournament ({tourneyTeams.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tourneyTeams.length === 0
                  ? '0 teams: 1 empty Final match scheduled.'
                  : tourneyTeams.length <= 2
                  ? `${tourneyTeams.length} team(s): 1 Final match scheduled.`
                  : tourneyTeams.length <= 4
                  ? `${tourneyTeams.length} teams: Semifinals + Final automatically scheduled.`
                  : `${tourneyTeams.length} teams: Quarterfinals + Semifinals + Final automatically scheduled.`}
              </Typography>
            </div>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="add-team-select-label">Add Existing Team</InputLabel>
                <Select
                  labelId="add-team-select-label"
                  value={teamToAdd}
                  label="Add Existing Team"
                  onChange={(e) => setTeamToAdd(e.target.value)}
                >
                  {availableTeams
                    .filter((t) => !tourneyTeams.includes(t.name))
                    .map((t) => (
                      <MenuItem key={t.id} value={t.name}>
                        {t.name} (#{t.ranking})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                disabled={!teamToAdd}
                onClick={handleAddTeamToTournament}
                sx={{
                  bgcolor: '#f04b3a',
                  color: '#fff',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  px: 2,
                  py: 1,
                  '&:hover': { bgcolor: '#d93b2a' },
                }}
              >
                + Add Team
              </Button>
            </Stack>
          </Stack>

          {tourneyTeams.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, pt: 1 }}>
              {tourneyTeams.map((teamName) => (
                <Chip
                  key={teamName}
                  label={teamName}
                  onDelete={() => handleRemoveTeamFromTournament(teamName)}
                  avatar={<TeamLogo teamName={teamName} size={20} />}
                  sx={{ fontWeight: 700, bgcolor: 'background.default' }}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pt: 0.5 }}>
              No teams added yet. The tournament starts with 1 empty Final match. Adding 3 teams will automatically generate Semifinals, and 5 teams will add Quarterfinals!
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* Drag and Drop Seeding Workspace */}
      <Grid container spacing={3}>
        {/* Left column: Available Teams Pool for Dragging */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              position: 'sticky',
              top: 75,
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              bgcolor: '#1b1e24',
              color: '#fff',
              border: '1px solid #30343b',
            }}
          >
            <Typography variant="h2" sx={{ fontSize: 14, color: '#fff', mb: 1 }}>
              AVAILABLE TEAMS
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b929e', display: 'block', mb: 2 }}>
              Drag any team below and drop into a match slot on the right:
            </Typography>

            <Stack spacing={1}>
              {availableTeams.map((team) => {
                const isParticipating = tourneyTeams.includes(team.name)
                return (
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
                      bgcolor: isParticipating ? '#293241' : '#242832',
                      borderRadius: 1,
                      border: isParticipating ? '1px solid #f04b3a' : '1px solid #3a4150',
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
                        #{team.ranking} in World {isParticipating ? '• in tournament' : ''}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
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

        {/* Right column: Match Seeding Slots with Drag-and-Drop Dropzones */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          <Stack spacing={3}>
            {/* Quick Match Seeding Slots Box */}
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fff' }}>
              <Typography variant="h2" sx={{ mb: 0.5 }}>
                Match Seeding Drop Slots ({uniqueMatches.length} Matches)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Drop teams onto Slot A or Slot B to seed them into this match:
              </Typography>

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

                      {/* Slot A Dropzone */}
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

                      {/* Slot B Dropzone */}
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
            </Paper>

            {/* Live Bracket Visualization of the Selected Type */}
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
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Snackbar feedback */}
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
