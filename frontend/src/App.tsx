import { RouterProvider } from 'react-router-dom'
import { router } from './router/router'
import { AuthProvider } from './app/providers/AuthProvider'
import { TournamentProvider } from './app/providers/TournamentProvider'

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <RouterProvider router={router} />
      </TournamentProvider>
    </AuthProvider>
  )
}

export default App
