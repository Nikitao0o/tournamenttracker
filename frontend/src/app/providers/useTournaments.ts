import { useContext } from 'react'
import { TournamentContext, type TournamentContextType } from './TournamentContext'

export function useTournaments(): TournamentContextType {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournaments must be used within a TournamentProvider')
  }
  return context
}
