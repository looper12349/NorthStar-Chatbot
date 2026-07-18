import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import PaletteIcon from '@mui/icons-material/Palette';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Message from './Message';
import QuickReplies from './QuickReplies';
import QuizPanel from './QuizPanel';
import TypingIndicator from './TypingIndicator';
import ThemeSettingsPanel from './ThemeSettingsPanel';
import { NorthStarIcon } from './iconRegistry';
import { initializeConversation, processInput } from '../engine/conversationFlow';

/**
 * The chat surface: header, settings panel, message log, quiz/quick
 * replies, composer. Conversation state lives here and survives
 * minimize/expand cycles because the surface is never unmounted.
 *
 * Scrolling is fully contained: the message list scrolls via
 * container.scrollTo (never scrollIntoView), and every programmatic
 * focus uses {preventScroll: true}, so the host page never moves.
 */
function ChatWindow({
  surface,
  isMobile,
  isFullscreen,
  onMinimize,
  onToggleFullscreen,
  settings,
  onChangeSettings,
  onUnread
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversationState, setConversationState] = useState(initializeConversation());

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const didInitRef = useRef(false);
  const nextIdRef = useRef(1);
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;

  // Contained auto-scroll: scroll the list element only — never the page.
  // A second pass at 800ms catches cards that grow after mount (the
  // recommendation card's reveal phase).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toBottom = () =>
      el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    toBottom();
    const late = setTimeout(toBottom, 800);
    return () => clearTimeout(late);
  }, [messages, isTyping, quickReplies]);

  // Move focus into the composer whenever the widget opens (the launcher
  // may unmount on mobile, and the dialog should receive focus anyway).
  useEffect(() => {
    if (surface !== 'closed') {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [surface]);

  // Start the conversation the first time the widget opens
  // (guarded: StrictMode runs effects twice).
  useEffect(() => {
    if (surface !== 'closed' && !didInitRef.current) {
      didInitRef.current = true;
      handleBotResponse('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface]);

  const makeMessage = (fields) => ({ id: nextIdRef.current++, ...fields });

  /**
   * Send user input to the engine.
   * `display` optionally overrides how the user's turn renders
   * (quiz answers render as an icon chip instead of a text bubble).
   */
  const handleSendMessage = (text, display) => {
    if (!text.trim() || isTyping) return;

    // Built outside the updater: updaters must stay pure (StrictMode
    // double-invokes them, which would double-bump the id counter).
    const userMessage = makeMessage(display || { sender: 'user', kind: 'text', text: text.trim() });
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setQuickReplies([]);
    setQuiz(null);

    // Clicking a chip/tile unmounts it — return focus to the composer so
    // keyboard users aren't dropped to <body>.
    inputRef.current?.focus({ preventScroll: true });

    handleBotResponse(text.trim());
  };

  const handleBotResponse = (userInput) => {
    setIsTyping(true);

    const typingDelay = 800 + Math.random() * 400;

    setTimeout(() => {
      const response = processInput(userInput, conversationState);

      setConversationState((prev) => ({
        state: response.newState,
        fallbackCount: response.fallbackCount !== undefined ? response.fallbackCount : 0,
        context: response.context || {},
        history: [...prev.history, { userInput, response }],
        lastOrderNumber:
          response.lastOrderNumber !== undefined ? response.lastOrderNumber : prev.lastOrderNumber,
        currentFlow: response.currentFlow !== undefined ? response.currentFlow : prev.currentFlow,
        lastFlow: response.lastFlow !== undefined ? response.lastFlow : prev.lastFlow
      }));

      // Normalize engine output: plain strings become text messages,
      // rich objects ({type, ...payload}) become typed cards.
      const botMessages = response.messages.map((entry) =>
        typeof entry === 'string'
          ? makeMessage({ sender: 'bot', kind: 'text', text: entry })
          : makeMessage({ sender: 'bot', kind: entry.type, payload: entry })
      );

      setMessages((prev) => [...prev, ...botMessages]);
      setQuickReplies(response.quickReplies || []);
      setQuiz(response.quiz || null);
      setIsTyping(false);

      if (surfaceRef.current === 'closed') {
        onUnread(botMessages.length);
      }
    }, typingDelay);
  };

  const handleQuickReply = (reply) => {
    const display = quiz
      ? { sender: 'user', kind: 'quizAnswer', text: reply.label, icon: reply.icon }
      : undefined;
    handleSendMessage(reply.value, display);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const columnSx = isFullscreen
    ? { width: '100%', maxWidth: 840, mx: 'auto' }
    : { width: '100%' };

  // Header sits on the accent gradient: the global accent-colored focus
  // ring would vanish there, so these buttons use contrast-colored rings.
  // 44px touch targets on coarse pointers, denser on desktop.
  const headerBtnSx = {
    width: { xs: 44, sm: 36 },
    height: { xs: 44, sm: 36 },
    '&.Mui-focusVisible': {
      outline: (t) => `3px solid ${t.palette.primary.contrastText}`,
      outlineOffset: '1px'
    }
  };

  return (
    <>
      {/* Header */}
      <Box
        component="header"
        sx={{
          background: (t) => t.palette.headerGradient,
          color: 'primary.contrastText',
          flexShrink: 0
        }}
      >
        <Box sx={{ ...columnSx, display: 'flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 1.5 }}>
          <Avatar
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'inherit', width: 40, height: 40 }}
            aria-hidden="true"
          >
            <NorthStarIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h1"
              noWrap
              sx={{ fontSize: '0.95rem', lineHeight: 1.3 }}
            >
              North Star Outdoors
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, opacity: 0.9 }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#7CFC98',
                  // keep the dot visible when the header gradient is light
                  // (dark-mode accents are pale)
                  boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.35)',
                  flexShrink: 0
                }}
              />
              Customer Support — online
            </Typography>
          </Box>
          <Tooltip title="Theme settings">
            <IconButton
              color="inherit"
              size="small"
              sx={headerBtnSx}
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Theme settings"
              aria-expanded={settingsOpen}
            >
              <PaletteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!isMobile && (
            <Tooltip title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
              <IconButton
                color="inherit"
                size="small"
                sx={headerBtnSx}
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit full screen' : 'Expand to full screen'}
              >
                {isFullscreen ? (
                  <CloseFullscreenIcon fontSize="small" />
                ) : (
                  <OpenInFullIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Minimize">
            <IconButton
              color="inherit"
              size="small"
              sx={headerBtnSx}
              onClick={onMinimize}
              aria-label="Minimize chat"
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <ThemeSettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={onChangeSettings}
        columnSx={columnSx}
      />

      {/* Message log */}
      <Box
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ ...columnSx, px: 2, py: 2 }}>
          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              showAvatar={
                index === messages.length - 1 || messages[index + 1].sender !== message.sender
              }
              grouped={index > 0 && messages[index - 1].sender === message.sender}
            />
          ))}

          {isTyping && <TypingIndicator />}

          {!isTyping && quickReplies.length > 0 && quiz && (
            <QuizPanel quiz={quiz} replies={quickReplies} onSelect={handleQuickReply} />
          )}
          {!isTyping && quickReplies.length > 0 && !quiz && (
            <QuickReplies replies={quickReplies} onSelect={handleQuickReply} />
          )}
        </Box>
      </Box>

      {/* Composer */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          pb: 'env(safe-area-inset-bottom)'
        }}
      >
        <Box sx={{ ...columnSx, display: 'flex', gap: 1, alignItems: 'center', px: 2, py: 1.5 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Type your message…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{
              htmlInput: { 'aria-label': 'Type your message', style: { fontSize: 16 } }
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '22px', bgcolor: 'background.default' }
            }}
          />
          <IconButton
            color="primary"
            onClick={() => handleSendMessage(inputValue)}
            disabled={isTyping || !inputValue.trim()}
            aria-label="Send message"
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}

export default ChatWindow;
