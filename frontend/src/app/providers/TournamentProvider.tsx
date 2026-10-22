import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { CreateTournamentInput, Tournament, UpdateTournamentInput } from '../../types'
import { apiClient } from '../../shared/api/client'
import { storage } from '../../shared/api/storage'
import { useAuth } from './useAuth'
import { TournamentContext } from './TournamentContext'

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => storage.getTournaments() ?? [])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const refreshTournaments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.getTournaments()
      setTournaments(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    apiClient
      .getTournaments()
      .then((data) => {
        if (active) {
          setTournaments(data)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load tournaments')
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const createTournament = async (input: CreateTournamentInput): Promise<Tournament> => {
    const created = await apiClient.createTournament(input, token)
    setTournaments((prev) => [created, ...prev])
    return created
  }

  const updateTournament = async (id: string, input: UpdateTournamentInput): Promise<Tournament> => {
    const updated = await apiClient.updateTournament(id, input, token)
    setTournaments((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const deleteTournament = async (id: string): Promise<void> => {
    await apiClient.deleteTournament(id, token)
    setTournaments((prev) => prev.filter((t) => t.id !== id))
  }

  const getTournament = (id: string): Tournament | undefined => {
    return tournaments.find((t) => t.id === id)
  }

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        isLoading,
        error,
        refreshTournaments,
        createTournament,
        updateTournament,
        deleteTournament,
        getTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  )
}
