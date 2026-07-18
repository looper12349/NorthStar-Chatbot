import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { iconForReply } from './iconRegistry';

/**
 * Standard quick-reply chips (non-quiz). Icons resolve from the registry
 * by explicit engine key or by well-known reply value.
 */
function QuickReplies({ replies, onSelect }) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <Box
      role="group"
      aria-label="Suggested replies"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: '44px', mb: 2 }}
    >
      {replies.map((reply) => {
        const Icon = iconForReply(reply);
        return (
          <Chip
            key={reply.label + reply.value}
            clickable
            variant="outlined"
            color="primary"
            icon={Icon ? <Icon /> : undefined}
            label={reply.label}
            onClick={() => onSelect(reply)}
            sx={{ height: 44, borderRadius: '22px', px: 0.5, fontSize: '0.9rem' }}
          />
        );
      })}
    </Box>
  );
}

export default QuickReplies;
