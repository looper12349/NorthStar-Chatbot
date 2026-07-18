import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import LinearProgress from '@mui/material/LinearProgress';
import { keyframes } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const confettiFall = keyframes`
  0% { transform: translateY(-4px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(56px) rotate(220deg); opacity: 0; }
`;

const STATUS_CHIP = {
  Processing: { color: 'default' },
  Shipped: { color: 'primary' },
  Delivered: { color: 'success' }
};

/**
 * Gamified order tracker: journey stepper + animated progress bar,
 * delivery estimate, and a one-shot confetti celebration when delivered.
 * Pure presentation — everything comes from the engine payload.
 */
function OrderTrackingCard({ payload }) {
  const { orderNumber, status, deliveryEstimate, steps, activeStep, progressPct } = payload;
  const delivered = status === 'Delivered';

  // Progress bar "draws itself" on mount (skipped under reduced motion).
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // No "ran once" ref guard here: StrictMode runs effect → cleanup →
  // effect, and a ref guard would leave the timeout cancelled forever
  // (bar stuck at 0). Re-scheduling is idempotent, so just let it re-run.
  const [pct, setPct] = useState(reduceMotion ? progressPct : 0);
  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setTimeout(() => setPct(progressPct), 150);
    return () => clearTimeout(id);
  }, [progressPct, reduceMotion]);

  return (
    <Card
      variant="outlined"
      sx={{ width: '100%', maxWidth: 400, p: 2, borderRadius: '16px', position: 'relative', overflow: 'hidden' }}
    >
      <span className="visually-hidden">
        {`Order ${orderNumber}: ${status}. ${deliveryEstimate}.`}
      </span>

      <Box aria-hidden="true">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: (t) => t.palette.accentSoft.bg,
              color: 'primary.main'
            }}
          >
            {delivered ? <EmojiEventsIcon fontSize="small" /> : <LocalShippingIcon fontSize="small" />}
          </Avatar>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            Order #{orderNumber}
          </Typography>
          <Chip size="small" label={status} color={STATUS_CHIP[status]?.color || 'default'} />
        </Box>

        <Stepper activeStep={delivered ? steps.length : activeStep} alternativeLabel sx={{ mb: 1.5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { fontSize: '0.7rem', mt: 0.5 },
                  '& .MuiSvgIcon-root': { fontSize: 20 }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <LinearProgress
          variant="determinate"
          value={pct}
          color={delivered ? 'success' : 'primary'}
          sx={{
            height: 8,
            borderRadius: '4px',
            mb: 1.5,
            '& .MuiLinearProgress-bar': { transition: 'transform 900ms cubic-bezier(0.2, 0, 0, 1)' }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {deliveryEstimate}
          </Typography>
        </Box>

        {delivered && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: (t) => t.palette.accentSoft.bg,
              color: (t) => t.palette.accentSoft.text,
              position: 'relative'
            }}
          >
            <EmojiEventsIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Delivered — enjoy the outdoors!
            </Typography>
            {!reduceMotion &&
              [...Array(10)].map((_, i) => (
                <Box
                  key={i}
                  component="span"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: `${8 + i * 9}%`,
                    width: 6,
                    height: 6,
                    borderRadius: i % 2 ? '50%' : '1px',
                    bgcolor: (t) => t.palette.celebration[i % t.palette.celebration.length],
                    animation: `${confettiFall} ${700 + (i % 4) * 150}ms ease-in ${i * 60}ms 1 both`,
                    pointerEvents: 'none'
                  }}
                />
              ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default OrderTrackingCard;
