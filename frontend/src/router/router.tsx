import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { AboutPage } from '../pages/AboutPage'
import { HomePage } from '../pages/HomePage'
import { PlayerLeaderboardPage } from '../pages/PlayerLeaderboardPage'
import { MatchPage } from '../pages/MatchPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlayerPage } from '../pages/PlayerPage'
import { PlayersPage } from '../pages/PlayersPage'
import { TeamPage } from '../pages/TeamPage'
import { TeamLeaderboardPage } from '../pages/TeamLeaderboardPage'
import { TeamsPage } from '../pages/TeamsPage'
import { TournamentPage } from '../pages/TournamentPage'
import { TournamentsPage } from '../pages/TournamentsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'tournaments', element: <TournamentsPage /> },
      { path: 'tournaments/:id', element: <TournamentPage /> },
      { path: 'leaderboards/teams', element: <TeamLeaderboardPage /> },
      { path: 'leaderboards/players', element: <PlayerLeaderboardPage /> },
      { path: 'teams/:teamRef', element: <TeamPage /> },
      { path: 'matches/:id', element: <MatchPage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'players/:id', element: <PlayerPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
