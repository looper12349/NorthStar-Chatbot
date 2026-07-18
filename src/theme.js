/**
 * Widget theme factory.
 *
 * Two-axis theming: mode (light/dark) x accent preset. White + green
 * ("Trail Green") is the default identity. Components never reference raw
 * hex or primary.main for surfaces — they use the semantic slots below
 * (palette.bubble, palette.accentSoft, palette.headerGradient,
 * palette.celebration), so switching accents touches zero component code.
 *
 * Selection persists to localStorage (guarded for private-mode Safari).
 */
import { createTheme } from '@mui/material/styles';

export const ACCENT_PRESETS = {
  trail: {
    label: 'Trail Green',
    light: { main: '#4a7c2c', dark: '#2d5016', contrast: '#ffffff' },
    dark: { main: '#8fbf6f', dark: '#6faa4a', contrast: '#0f1a08' },
    celebration: ['#4a7c2c', '#8fbf6f', '#f2b632', '#e8f5e9']
  },
  pine: {
    label: 'Pine Teal',
    light: { main: '#00796b', dark: '#004d40', contrast: '#ffffff' },
    dark: { main: '#5db8ab', dark: '#33a08f', contrast: '#04211c' },
    celebration: ['#00796b', '#5db8ab', '#f2b632', '#e0f2f1']
  },
  lake: {
    label: 'Lake Blue',
    light: { main: '#1565c0', dark: '#0d47a1', contrast: '#ffffff' },
    dark: { main: '#7aa8e8', dark: '#5e92f3', contrast: '#071733' },
    celebration: ['#1565c0', '#7aa8e8', '#f2b632', '#e3f2fd']
  },
  ember: {
    label: 'Ember Orange',
    // main deepened from #d84315: white on #d84315 is 4.44:1, just under AA
    light: { main: '#bf360c', dark: '#870000', contrast: '#ffffff' },
    dark: { main: '#ff8a65', dark: '#f4703d', contrast: '#331104' },
    celebration: ['#bf360c', '#ff8a65', '#ffd54f', '#fbe9e7']
  },
  summit: {
    label: 'Summit Plum',
    light: { main: '#6a1b9a', dark: '#38006b', contrast: '#ffffff' },
    // dark stop lightened: #26073a on #9c4dcc was 3.7:1 at the header
    // gradient's dark end
    dark: { main: '#ce93d8', dark: '#b968cf', contrast: '#26073a' },
    celebration: ['#6a1b9a', '#ce93d8', '#f2b632', '#f3e5f5']
  }
};

export const DEFAULT_SETTINGS = { mode: 'light', accent: 'trail' };

const STORAGE_KEY = 'nso-widget-settings';

/** Load persisted widget settings ({mode, accent, surface}). */
export function loadWidgetSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      accent: ACCENT_PRESETS[parsed.accent] ? parsed.accent : DEFAULT_SETTINGS.accent,
      // Never restore fullscreen — only closed/open survive a reload.
      surface: parsed.surface === 'open' ? 'open' : 'closed'
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveWidgetSettings(settings) {
  try {
    const { mode, accent, surface } = settings;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, accent, surface: surface === 'fullscreen' ? 'open' : surface })
    );
  } catch {
    // storage unavailable (private mode) — settings simply won't persist
  }
}

export function createWidgetTheme({ mode, accent }) {
  const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.trail;
  const a = mode === 'dark' ? preset.dark : preset.light;
  const light = mode !== 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: a.main, dark: a.dark, contrastText: a.contrast },
      background: light
        ? { default: '#f6f8f6', paper: '#ffffff' }
        : { default: '#121712', paper: '#1c231c' },
      text: light
        ? { primary: '#1a2420', secondary: '#54655c' }
        : { primary: '#e8eee6', secondary: '#a7b6a3' },
      // --- semantic widget slots (custom, resolved only via theme) ---
      bubble: light
        ? { bot: '#eef2ec', botText: '#1a2420', user: a.main, userText: a.contrast }
        : { bot: '#28312a', botText: '#e8eee6', user: a.main, userText: a.contrast },
      accentSoft: light
        ? { bg: `${a.main}14`, border: `${a.main}40`, text: a.dark }
        : { bg: `${a.main}22`, border: `${a.main}55`, text: a.main },
      headerGradient: `linear-gradient(135deg, ${a.dark} 0%, ${a.main} 100%)`,
      celebration: preset.celebration
    },
    // NOTE: numeric borderRadius values in sx MULTIPLY this base —
    // components use explicit px strings for radii to stay predictable.
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Sora", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 700 },
      overline: { fontWeight: 700, letterSpacing: '0.08em' },
      button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } }
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `3px solid ${a.main}`,
              outlineOffset: 2
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } }
      },
      MuiTooltip: {
        defaultProps: { enterDelay: 500 }
      }
    }
  });
}
