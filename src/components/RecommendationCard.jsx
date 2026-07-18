import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import LinearProgress from '@mui/material/LinearProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { ICONS } from './iconRegistry';

/**
 * Match-reveal card: a short "Matching your answers…" phase, then the
 * recommendation crossfades in with a counting match score. The score is
 * deterministic (engine-computed) and labeled as a match, never as
 * inventory or a real algorithm.
 */
function RecommendationCard({ payload }) {
  const {
    matchScore,
    activityLabel,
    activityIcon,
    needLabel,
    needIcon,
    category,
    description,
    tip
  } = payload;

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [revealed, setRevealed] = useState(reduceMotion);
  const [score, setScore] = useState(reduceMotion ? matchScore : 0);
  const rafRef = useRef(null);
  const startedRef = useRef(false);

  // Phase 1 → phase 2 reveal.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setTimeout(() => setRevealed(true), 650);
    return () => clearTimeout(id);
  }, [reduceMotion]);

  // Count-up once revealed (guarded against StrictMode double-invoke).
  useEffect(() => {
    if (!revealed || reduceMotion || startedRef.current) return undefined;
    startedRef.current = true;
    const startTime = performance.now();
    const duration = 700;
    const tick = (now) => {
      // rAF frame timestamps can predate performance.now() captured above —
      // clamp at 0 or the eased score goes negative for a frame.
      const t = Math.max(0, Math.min(1, (now - startTime) / duration));
      setScore(Math.round(matchScore * (1 - Math.pow(1 - t, 3))));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [revealed, reduceMotion, matchScore]);

  const ActivityIcon = activityIcon ? ICONS[activityIcon] : null;
  const NeedIcon = needIcon ? ICONS[needIcon] : null;

  return (
    <Card variant="outlined" sx={{ width: '100%', maxWidth: 400, p: 2, borderRadius: '16px' }}>
      <span className="visually-hidden">
        {`Recommended: ${category}. ${description} Pro tip: ${tip}`}
      </span>

      {!revealed && (
        <Box aria-hidden="true" sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Matching your answers…
          </Typography>
          <LinearProgress aria-hidden="true" sx={{ height: 6, borderRadius: '3px' }} />
        </Box>
      )}

      <Fade in={revealed} timeout={reduceMotion ? 0 : 350}>
        <Box aria-hidden="true" sx={{ display: revealed ? 'block' : 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AutoAwesomeIcon fontSize="small" color="primary" />
            <Typography variant="overline" sx={{ color: (t) => t.palette.accentSoft.text }}>
              Match found
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="subtitle2" color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {score}% match
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={score}
            sx={{ height: 6, borderRadius: '3px', mb: 1.5 }}
          />

          <Typography variant="h6" sx={{ fontSize: '1.05rem', mb: 0.75 }}>
            {category}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
            <Chip
              size="small"
              variant="outlined"
              icon={ActivityIcon ? <ActivityIcon /> : undefined}
              label={activityLabel}
            />
            <Chip
              size="small"
              variant="outlined"
              icon={NeedIcon ? <NeedIcon /> : undefined}
              label={needLabel}
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {description}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 1.25,
              borderRadius: '10px',
              bgcolor: (t) => t.palette.accentSoft.bg,
              border: 1,
              borderColor: (t) => t.palette.accentSoft.border
            }}
          >
            <TipsAndUpdatesIcon fontSize="small" sx={{ color: (t) => t.palette.accentSoft.text, mt: '1px' }} />
            <Typography variant="body2" sx={{ color: (t) => t.palette.accentSoft.text }}>
              <strong>Pro tip:</strong> {tip}
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Card>
  );
}

export default RecommendationCard;
