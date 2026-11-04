import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { ProtectedAdminRoute } from '../app/router/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const m = await import('../pages/HomePage')
          return { Component: m.HomePage }
        },
      },
      {
        path: 'about',
        lazy: async () => {
          const m = await import('../pages/AboutPage')
          return { Component: m.AboutPage }
        },
      },
      {
        path: 'tournaments',
        lazy: async () => {
          const m = await import('../pages/TournamentsPage')
          return { Component: m.TournamentsPage }
        },
      },
      {
        path: 'tournaments/:id',
        lazy: async () => {
          const m = await import('../pages/TournamentPage')
          return { Component: m.TournamentPage }
        },
      },
      {
        path: 'leaderboards/teams',
        lazy: async () => {
          const m = await import('../pages/TeamLeaderboardPage')
          return { Component: m.TeamLeaderboardPage }
        },
      },
      {
        path: 'leaderboards/players',
        lazy: async () => {
          const m = await import('../pages/PlayerLeaderboardPage')
          return { Component: m.PlayerLeaderboardPage }
        },
      },
      {
        path: 'teams/:teamRef',
        lazy: async () => {
          const m = await import('../pages/TeamPage')
          return { Component: m.TeamPage }
        },
      },
      {
        path: 'matches/:id',
        lazy: async () => {
          const m = await import('../pages/MatchPage')
          return { Component: m.MatchPage }
        },
      },
      {
        path: 'teams',
        lazy: async () => {
          const m = await import('../pages/TeamsPage')
          return { Component: m.TeamsPage }
        },
      },
      {
        path: 'players',
        lazy: async () => {
          const m = await import('../pages/PlayersPage')
          return { Component: m.PlayersPage }
        },
      },
      {
        path: 'players/:id',
        lazy: async () => {
          const m = await import('../pages/PlayerPage')
          return { Component: m.PlayerPage }
        },
      },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            path: 'admin',
            lazy: async () => {
              const m = await import('../pages/admin/AdminPage')
              return { Component: m.AdminPage }
            },
          },
          {
            path: 'admin/matches',
            lazy: async () => {
              const m = await import('../pages/admin/AdminMatchesPage')
              return { Component: m.AdminMatchesPage }
            },
          },
          {
            path: 'admin/bracket',
            lazy: async () => {
              const m = await import('../pages/admin/AdminBracketEditorPage')
              return { Component: m.AdminBracketEditorPage }
            },
          },
          {
            path: 'admin/tournaments/:id/bracket',
            lazy: async () => {
              const m = await import('../pages/admin/AdminBracketEditorPage')
              return { Component: m.AdminBracketEditorPage }
            },
          },
        ],
      },
      {
        path: '*',
        lazy: async () => {
          const m = await import('../pages/NotFoundPage')
          return { Component: m.NotFoundPage }
        },
      },
    ],
  },
])
