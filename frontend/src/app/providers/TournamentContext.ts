import { createContext } from 'react'
import type { CreateTournamentInput, Tournament, UpdateTournamentInput } from '../../types'

export interface TournamentContextType {
  tournaments: Tournament[]
  isLoading: boolean
  error: string | null
  refreshTournaments: () => Promise<void>
  createTournament: (input: CreateTournamentInput) => Promise<Tournament>
  updateTournament: (id: string, input: UpdateTournamentInput) => Promise<Tournament>
  deleteTournament: (id: string) => Promise<void>
  getTournament: (id: string) => Tournament | undefined
}

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined)
