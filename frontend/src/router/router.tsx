import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { AboutPage } from '../pages/AboutPage'
import { HomePage } from '../pages/HomePage'
import { PlayerLeaderboardPage } from '../pages/PlayerLeaderboardPage'
import { MatchPage } from '../pages/MatchPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { TeamLeaderboardPage } from '../pages/TeamLeaderboardPage'
import { TeamPage } from '../pages/TeamPage'
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
      { path: 'teams/:slug', element: <TeamPage /> },
      { path: 'matches/:id', element: <MatchPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
