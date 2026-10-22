import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { useTournaments } from '../../app/providers/useTournaments'
import { TournamentStatusLabel } from '../../components/StatusChips'
import { DeleteConfirmDialog } from '../../features/manage-tournaments/ui/DeleteConfirmDialog'
import { TournamentFormDialog } from '../../features/manage-tournaments/ui/TournamentFormDialog'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorAlert } from '../../shared/ui/ErrorAlert'
import { TableRowSkeleton } from '../../shared/ui/LoadingSkeleton'
import { formatDate } from '../../utils/formatting'
import type { CreateTournamentInput, Tournament, UpdateTournamentInput } from '../../types'

export function AdminPage() {
  const { tournaments, isLoading, error, createTournament, updateTournament, deleteTournament, refreshTournaments } =
    useTournaments()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null)

  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const handleOpenCreate = () => {
    setEditingTournament(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (t: Tournament) => {
    setEditingTournament(t)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: CreateTournamentInput) => {
    try {
      if (editingTournament) {
        await updateTournament(editingTournament.id, data as UpdateTournamentInput)
        setNotification({ message: `Турнир "${data.title}" успешно обновлен!`, severity: 'success' })
      } else {
        await createTournament(data)
        setNotification({ message: `Турнир "${data.title}" успешно создан!`, severity: 'success' })
      }
    } catch (err: unknown) {
      setNotification({
        message: err instanceof Error ? err.message : 'Произошла ошибка при сохранении турнира',
        severity: 'error',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTournament) return
    try {
      const title = deletingTournament.title
      await deleteTournament(deletingTournament.id)
      setNotification({ message: `Турнир "${title}" успешно удален`, severity: 'success' })
    } catch (err: unknown) {
      setNotification({
        message: err instanceof Error ? err.message : 'Ошибка при удалении турнира',
        severity: 'error',
      })
    } finally {
      setDeletingTournament(null)
    }
  }

  const filtered = tournaments.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()),
  )

  const countOngoing = tournaments.filter((t) => t.status === 'Ongoing').length
  const countUpcoming = tournaments.filter((t) => t.status === 'Upcoming').length
  const countCompleted = tournaments.filter((t) => t.status === 'Completed').length

  return (
    <Stack spacing={2.5}>
      {/* Шапка админ-панели */}
      <Box
        sx={{
          bgcolor: 'secondary.main',
          color: '#fff',
          p: { xs: 2, sm: 3 },
          border: '1px solid #30343b',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <div>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 } }}>
              ADMIN PANEL: ТУРНИРЫ
            </Typography>
            <Chip label="Full Access" size="small" sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800 }} />
          </Stack>
          <Typography sx={{ color: '#9aa7b3', fontSize: 12 }}>
            Панель администратора для создания, изменения и удаления турниров и сеток
          </Typography>
        </div>

        <Button
          variant="contained"
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#f04b3a',
            color: '#fff',
            fontWeight: 800,
            px: 2.5,
            py: 1,
            '&:hover': { bgcolor: '#d93b2a' },
          }}
        >
          + Создать турнир
        </Button>
      </Box>

      {/* Быстрая статистика */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
          <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            Всего турниров
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5 }}>{tournaments.length}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
          <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            Ongoing (Идут)
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'error.main', mt: 0.5 }}>
            {countOngoing}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
          <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            Upcoming (Скоро)
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
            {countUpcoming}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
          <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            Completed (Завершены)
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.secondary', mt: 0.5 }}>
            {countCompleted}
          </Typography>
        </Paper>
      </Stack>

      {error ? <ErrorAlert message={error} onRetry={refreshTournaments} /> : null}

      {/* Поиск и фильтрация таблицы */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <TextField
          placeholder="Поиск по турнирам..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              sx: { bgcolor: 'background.default' },
            },
          }}
        />
      </Paper>

      {/* Таблица турниров */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>НАЗВАНИЕ ТУРНИРА</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>ЛОКАЦИЯ</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>ПРИЗОВОЙ ФОНД</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>ДАТЫ ПРОВЕДЕНИЯ</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>СТАТУС</TableCell>
              <TableCell align="right" sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>
                ДЕЙСТВИЯ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 2 }}>
                  <TableRowSkeleton count={4} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 0 }}>
                  <EmptyState
                    title="Турниры не найдены"
                    description="Нет турниров, соответствующих критериям поиска."
                    actionLabel="+ Создать турнир"
                    onAction={handleOpenCreate}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{
                    transition: 'background-color 150ms',
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell>
                    <Typography
                      component={Link}
                      to={`/tournaments/${t.id}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: 'text.primary',
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                      }}
                    >
                      {t.title}
                    </Typography>
                    {t.bracketType ? (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Сетка: {t.bracketType}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{t.location}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{t.prizePool}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {formatDate(t.startDate)} — {formatDate(t.endDate)}
                  </TableCell>
                  <TableCell>
                    <TournamentStatusLabel status={t.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEdit(t)}
                        sx={{ fontSize: 11, py: 0.4, px: 1 }}
                      >
                        Изменить
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletingTournament(t)}
                        aria-label="Удалить турнир"
                        sx={{ borderRadius: 0.5 }}
                      >
                        🗑️
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог создания / редактирования */}
      <TournamentFormDialog
        open={formOpen}
        tournament={editingTournament}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Диалог подтверждения удаления */}
      <DeleteConfirmDialog
        open={Boolean(deletingTournament)}
        title={deletingTournament?.title}
        onClose={() => setDeletingTournament(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Всплывающее уведомление об успехе/ошибке */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert onClose={() => setNotification(null)} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  )
}
