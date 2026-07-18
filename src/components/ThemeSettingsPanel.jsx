import React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckIcon from '@mui/icons-material/Check';
import { ACCENT_PRESETS } from '../theme';

/**
 * In-widget theme settings: light/dark mode toggle + accent swatches.
 * Rendered as a Collapse panel under the header — deliberately no
 * Popover/Menu, so nothing portals outside the widget surface.
 */
function ThemeSettingsPanel({ open, settings, onChange, columnSx }) {
  return (
    <Collapse in={open}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box
          sx={{
            ...columnSx,
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Mode
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={settings.mode}
              onChange={(e, mode) => mode && onChange({ ...settings, mode })}
              aria-label="Color mode"
            >
              <ToggleButton
                value="light"
                aria-label="Light mode"
                sx={{ minWidth: { xs: 44 }, minHeight: { xs: 44 } }}
              >
                <LightModeIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton
                value="dark"
                aria-label="Dark mode"
                sx={{ minWidth: { xs: 44 }, minHeight: { xs: 44 } }}
              >
                <DarkModeIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Accent
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }} role="group" aria-label="Accent color">
              {Object.entries(ACCENT_PRESETS).map(([key, preset]) => {
                const selected = settings.accent === key;
                return (
                  <Tooltip key={key} title={preset.label}>
                    <ButtonBase
                      onClick={() => onChange({ ...settings, accent: key })}
                      aria-label={preset.label}
                      aria-pressed={selected}
                      sx={{
                        width: { xs: 44, sm: 34 },
                        height: { xs: 44, sm: 34 },
                        borderRadius: '50%',
                        bgcolor: preset.light.main,
                        color: '#fff',
                        border: 2,
                        borderColor: selected ? 'text.primary' : 'transparent'
                      }}
                    >
                      {selected && <CheckIcon sx={{ fontSize: 16 }} />}
                    </ButtonBase>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Collapse>
  );
}

export default ThemeSettingsPanel;
