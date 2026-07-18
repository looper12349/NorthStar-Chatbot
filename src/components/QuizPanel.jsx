import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonBase from '@mui/material/ButtonBase';
import { ICONS } from './iconRegistry';

/**
 * The "Gear Finder" quiz step: progress strip + icon tile grid.
 * Replaces plain quick replies whenever the engine sends quiz metadata,
 * making the recommendation flow feel like a two-step mini-game.
 */
function QuizPanel({ quiz, replies, onSelect }) {
  return (
    <Box
      role="group"
      aria-label={`Gear finder, step ${quiz.step} of ${quiz.total}: choose an option`}
      sx={{
        ml: '44px',
        mb: 2,
        p: 1.75,
        borderRadius: '14px',
        bgcolor: (t) => t.palette.accentSoft.bg,
        border: 1,
        borderColor: (t) => t.palette.accentSoft.border
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
          mb: 0.75
        }}
      >
        <Typography variant="overline" noWrap sx={{ color: (t) => t.palette.accentSoft.text }}>
          Gear finder
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ flexShrink: 0 }}>
          Step {quiz.step} of {quiz.total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(quiz.step - 1) * (100 / quiz.total) + 50 / quiz.total}
        aria-hidden="true"
        sx={{ mb: 1.5, height: 6, borderRadius: '3px' }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {replies.map((reply) => {
          const Icon = reply.icon ? ICONS[reply.icon] : null;
          return (
            <ButtonBase
              key={reply.value}
              focusRipple
              onClick={() => onSelect(reply)}
              sx={{
                flex: '1 1 44%',
                minWidth: 130,
                minHeight: 56,
                px: 1.5,
                py: 1,
                gap: 1,
                justifyContent: 'flex-start',
                borderRadius: '12px',
                border: 1,
                borderColor: (t) => t.palette.accentSoft.border,
                bgcolor: 'background.paper',
                color: 'text.primary',
                fontSize: '0.9rem',
                fontWeight: 600,
                textAlign: 'left',
                transition: (t) =>
                  t.transitions.create(['background-color', 'border-color', 'transform'], {
                    duration: 150
                  }),
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: (t) => t.palette.accentSoft.bg
                },
                '@media (prefers-reduced-motion: no-preference)': {
                  '&:active': { transform: 'scale(0.98)' }
                }
              }}
            >
              {Icon && <Icon color="primary" fontSize="small" aria-hidden="true" />}
              {reply.label}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

export default QuizPanel;
