import { useEffect, useState } from 'react'

type LoadedState<T> = {
  load: () => Promise<T>
  data?: T
  error?: Error
}

export function useApi<T>(load: () => Promise<T>) {
  const [state, setState] = useState<LoadedState<T>>()

  useEffect(() => {
    let active = true

    load().then(
      (data) => {
        if (active) setState({ load, data })
      },
      (reason: unknown) => {
        if (active) {
          setState({
            load,
            error: reason instanceof Error ? reason : new Error(String(reason)),
          })
        }
      },
    )

    return () => {
      active = false
    }
  }, [load])

  const isCurrent = state?.load === load
  return {
    data: isCurrent ? state.data : undefined,
    loading: !isCurrent,
    error: isCurrent ? state.error : undefined,
  }
}
