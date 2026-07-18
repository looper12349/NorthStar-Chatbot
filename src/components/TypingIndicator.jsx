import React from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
  30% { transform: translateY(-4px); opacity: 1; }
`;

/**
 * Animated "assistant is thinking" indicator.
 * Dots are decorative; screen readers get the hidden text.
 */
function TypingIndicator() {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 2,
        py: 1.5,
        ml: '44px',
        mb: 2,
        borderRadius: '18px',
        borderBottomLeftRadius: '6px',
        bgcolor: (t) => t.palette.bubble.bot
      }}
    >
      <span className="visually-hidden">Assistant is typing…</span>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          aria-hidden="true"
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: `${bounce} 1.4s infinite ease-in-out`,
            animationDelay: `${i * 0.2}s`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
      ))}
    </Box>
  );
}

export default TypingIndicator;
