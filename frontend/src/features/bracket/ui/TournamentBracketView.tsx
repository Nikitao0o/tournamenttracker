import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { TournamentBracketView as BracketViewType } from '../../../types'
import { CardSkeleton } from '../../../shared/ui/LoadingSkeleton'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { DoubleEliminationBracket } from './DoubleEliminationBracket'
import { SingleEliminationBracket } from './SingleEliminationBracket'
import { RoundRobinBracket } from './RoundRobinBracket'
import { SwissBracket } from './SwissBracket'

interface TournamentBracketViewProps {
  bracket: BracketViewType | null
  isLoading?: boolean
}

const BRACKET_FORMAT_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  double_elimination: {
    label: 'Double Elimination',
    badge: 'Upper & Lower Brackets',
    color: '#f04b3a',
  },
  single_elimination: {
    label: 'Single Elimination',
    badge: 'Knockout Tree',
    color: '#ffb300',
  },
  round_robin: {
    label: 'Round Robin',
    badge: 'All-Play-All Group Stage',
    color: '#00e5ff',
  },
  swiss: {
    label: 'Swiss System',
    badge: 'Swiss Record Pools (3W / 3L)',
    color: '#b388ff',
  },
}

export function TournamentBracketView({ bracket, isLoading }: TournamentBracketViewProps) {
  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, bgcolor: '#17191e' }}>
        <CardSkeleton count={3} />
      </Paper>
    )
  }

  if (!bracket) {
    return (
      <EmptyState
        title="No bracket available"
        description="Bracket generation is in progress or not yet scheduled for this tournament."
      />
    )
  }

  const formatKey = (bracket.bracketType || 'double_elimination').toLowerCase()
  const formatMeta = BRACKET_FORMAT_LABELS[formatKey] || {
    label: bracket.bracketType,
    badge: 'Tournament Stage',
    color: '#f04b3a',
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: '#17191e',
        borderColor: '#2d323b',
        borderRadius: 2,
      }}
    >
      {/* Format Header Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          pb: 2.5,
          mb: 3,
          borderBottom: '1px solid #282c35',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ fontSize: 20 }}>📊</Box>
          <div>
            <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
              TOURNAMENT BRACKET & PROGRESSION
            </Typography>
            <Typography sx={{ color: '#8b929e', fontSize: 12 }}>
              Format: {formatMeta.label}
            </Typography>
          </div>
        </Stack>

        <Chip
          label={formatMeta.badge}
          size="small"
          sx={{
            bgcolor: `${formatMeta.color}15`,
            color: formatMeta.color,
            fontWeight: 800,
            fontSize: 11,
            border: `1px solid ${formatMeta.color}40`,
          }}
        />
      </Stack>

      {/* Dynamic bracket format renderer */}
      {formatKey === 'single_elimination' ? (
        <SingleEliminationBracket bracket={bracket} />
      ) : formatKey === 'round_robin' ? (
        <RoundRobinBracket bracket={bracket} />
      ) : formatKey === 'swiss' ? (
        <SwissBracket bracket={bracket} />
      ) : (
        <DoubleEliminationBracket bracket={bracket} />
      )}
    </Paper>
  )
}
