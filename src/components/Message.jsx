import React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';
import { NorthStarIcon, ICONS } from './iconRegistry';
import OrderTrackingCard from './OrderTrackingCard';
import RecommendationCard from './RecommendationCard';

/**
 * One transcript row. Dispatches on message.kind:
 *  - text        → chat bubble
 *  - quizAnswer  → user's quiz choice as an icon chip (compact game record)
 *  - order       → OrderTrackingCard
 *  - recommendation → RecommendationCard
 */
function Message({ message, showAvatar = true, grouped = false }) {
  const isBot = message.sender === 'bot';

  let body;
  if (message.kind === 'order') {
    body = <OrderTrackingCard payload={message.payload} />;
  } else if (message.kind === 'recommendation') {
    body = <RecommendationCard payload={message.payload} />;
  } else if (message.kind === 'quizAnswer') {
    const Icon = message.icon ? ICONS[message.icon] : null;
    body = (
      <Chip
        color="primary"
        icon={Icon ? <Icon /> : <CheckIcon />}
        label={message.text}
        sx={{ height: 36, px: 0.5 }}
      />
    );
  } else {
    body = (
      <Box
        sx={{
          maxWidth: '82%',
          px: 2,
          py: 1.25,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '1rem',
          lineHeight: 1.5,
          bgcolor: (t) => (isBot ? t.palette.bubble.bot : t.palette.bubble.user),
          color: (t) => (isBot ? t.palette.bubble.botText : t.palette.bubble.userText),
          borderRadius: '18px',
          ...(isBot
            ? { borderBottomLeftRadius: '6px' }
            : { borderBottomRightRadius: '6px' })
        }}
      >
        {message.text}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        gap: 1.25,
        mb: grouped ? 0.5 : 2,
        mt: grouped ? 0 : undefined
      }}
    >
      {isBot &&
        (showAvatar ? (
          <Avatar
            aria-hidden="true"
            sx={{
              width: 32,
              height: 32,
              background: (t) => t.palette.headerGradient,
              color: 'primary.contrastText',
              flexShrink: 0
            }}
          >
            <NorthStarIcon sx={{ fontSize: 16 }} />
          </Avatar>
        ) : (
          <Box aria-hidden="true" sx={{ width: 32, flexShrink: 0 }} />
        ))}
      {body}
    </Box>
  );
}

export default Message;
