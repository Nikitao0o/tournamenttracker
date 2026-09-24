import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import HomePage from './pages/HomePage/HomePage'
import TournamentPage from './pages/TournamentPage/TournamentPage'
import MatchPage from './pages/MatchPage/MatchPage'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tournaments/:id', element: <TournamentPage /> },
      { path: '/matches/:id', element: <MatchPage /> },
    ],
  },
])