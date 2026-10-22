import { useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTournaments } from '../app/providers/useTournaments'
import { SectionHeader } from '../components/SectionHeader'
import { TournamentCard } from '../components/TournamentCard'
import { TournamentFilters } from '../features/filter-tournaments/ui/TournamentFilters'
import { EmptyState } from '../shared/ui/EmptyState'
import { ErrorAlert } from '../shared/ui/ErrorAlert'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'
import type { TournamentStatus } from '../types'

export function TournamentsPage() {
  const { tournaments, isLoading, error, refreshTournaments } = useTournaments()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'All'>('All')

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.title.toLowerCase().includes(search.toLowerCase()) ||
      tournament.location.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'All' || tournament.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('All')
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <SectionHeader title="Турниры и события" />

        <TournamentFilters
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          totalCount={tournaments.length}
          filteredCount={filteredTournaments.length}
          onReset={handleResetFilters}
        />

        {error ? (
          <Box sx={{ p: 2 }}>
            <ErrorAlert message={error} onRetry={refreshTournaments} />
          </Box>
        ) : null}

        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <CardSkeleton count={4} />
          </Box>
        ) : filteredTournaments.length === 0 ? (
          <EmptyState
            title="Турниры не найдены"
            description="Попробуйте изменить поисковый запрос или фильтр по статусу."
            actionLabel="Сбросить фильтры"
            onAction={handleResetFilters}
          />
        ) : (
          filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))
        )}
      </Box>
    </Stack>
  )
}
