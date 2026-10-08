import { createTheme } from '@mui/material/styles'

const navy = '#2d3e50'
const orange = '#eb6b22'
const pageBg = '#e4e8ed'
const boxBg = '#ffffff'
const live = '#c41e3a'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: orange,
      contrastText: '#fff',
    },
    secondary: {
      main: navy,
    },
    error: {
      main: live,
    },
    background: {
      default: pageBg,
      paper: boxBg,
    },
    divider: '#d4d9de',
    text: {
      primary: '#1b1f23',
      secondary: '#5e6a75',
    },
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 13,
    h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2 },
    h2: { fontSize: 13, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: pageBg,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: navy,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 18,
          fontSize: 10,
          fontWeight: 700,
        },
      },
    },
  },
})
