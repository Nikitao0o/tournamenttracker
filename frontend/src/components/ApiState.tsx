import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

type ApiStateProps = {
  loading: boolean
  error?: Error
}

export function ApiState({ loading, error }: ApiStateProps) {
  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 5 }}>
        <CircularProgress size={28} />
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">Could not load data from the API: {error.message}</Alert>
  }

  return null
}
