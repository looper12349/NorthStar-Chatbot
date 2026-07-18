import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Zoom from '@mui/material/Zoom';
import CloseIcon from '@mui/icons-material/Close';
import { createWidgetTheme, loadWidgetSettings, saveWidgetSettings } from '../theme';
import { NorthStarIcon } from './iconRegistry';
import ChatWindow from './ChatWindow';

/**
 * Floating support widget.
 *
 * Surface state machine: 'closed' → 'open' → 'fullscreen'.
 *  - OPEN: closed→open (mobile goes straight to fullscreen)
 *  - MINIMIZE: any→closed (focus returns to the launcher)
 *  - EXPAND/COLLAPSE: open↔fullscreen (desktop only)
 * The chat surface stays mounted while closed (visibility:hidden) so the
 * conversation, scroll position, and input draft survive minimize cycles.
 * Only 'closed'/'open' persist across reloads — never fullscreen.
 */
function SupportWidget() {
  const persisted = useRef(loadWidgetSettings());
  const [settings, setSettings] = useState({
    mode: persisted.current.mode,
    accent: persisted.current.accent
  });
  const [surface, setSurface] = useState(persisted.current.surface || 'closed');
  const [unreadCount, setUnreadCount] = useState(0);

  const isMobile = useMediaQuery('(max-width:599.95px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const theme = useMemo(() => createWidgetTheme(settings), [settings]);

  // Live mirror of surface for async callbacks (unread counting).
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;
  const fabRef = useRef(null);

  useEffect(() => {
    saveWidgetSettings({ ...settings, surface });
  }, [settings, surface]);

  // Fullscreen locks the host page scroll behind the widget. Compensate
  // for the vanishing scrollbar so the host layout doesn't shift.
  useEffect(() => {
    if (surface === 'fullscreen') {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const prevOverflow = document.body.style.overflow;
      const prevPadding = document.body.style.paddingRight;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPadding;
      };
    }
    return undefined;
  }, [surface]);

  const open = useCallback(() => {
    setUnreadCount(0);
    setSurface(isMobile ? 'fullscreen' : 'open');
  }, [isMobile]);

  const minimize = useCallback(() => {
    setSurface('closed');
    // Return focus to the launcher without scrolling the host page.
    setTimeout(() => fabRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setSurface((s) => (s === 'fullscreen' ? (isMobile ? 'closed' : 'open') : 'fullscreen'));
  }, [isMobile]);

  const handleUnread = useCallback((count) => {
    if (surfaceRef.current === 'closed') {
      setUnreadCount((n) => n + count);
    }
  }, []);

  const handleSurfaceKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (surface === 'fullscreen' && !isMobile) {
        setSurface('open');
      } else {
        minimize();
      }
    }
  };

  const isClosed = surface === 'closed';
  // Mobile has no compact mode: an open surface (e.g. restored from
  // localStorage or after a viewport shrink) always renders fullscreen.
  const isFullscreen = surface === 'fullscreen' || (isMobile && surface === 'open');
  // visibility included so hiding waits for the close animation;
  // bottom/right/width/height are all numeric lengths in both states so
  // the compact↔fullscreen morph actually animates (no 'auto' snapping).
  const transition = prefersReducedMotion
    ? 'none'
    : 'transform 220ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms ease, visibility 220ms, ' +
      'width 260ms cubic-bezier(0.2, 0, 0, 1), height 260ms cubic-bezier(0.2, 0, 0, 1), ' +
      'bottom 260ms cubic-bezier(0.2, 0, 0, 1), right 260ms cubic-bezier(0.2, 0, 0, 1), ' +
      'border-radius 260ms ease';

  return (
    <ThemeProvider theme={theme}>
      <Paper
        elevation={12}
        role="dialog"
        aria-label="North Star Outdoors support chat"
        aria-hidden={isClosed ? 'true' : undefined}
        onKeyDown={handleSurfaceKeyDown}
        // inert removes the hidden surface from tab order and the AT tree
        // (React 19 supports it as a boolean prop)
        inert={isClosed || undefined}
        sx={{
          position: 'fixed',
          zIndex: (t) => t.zIndex.modal,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transition,
          ...(isFullscreen
            ? {
                bottom: 0,
                right: 0,
                width: '100vw',
                height: '100vh',
                '@supports (height: 100dvh)': { height: '100dvh' },
                borderRadius: 0
              }
            : {
                bottom: 96,
                right: 24,
                width: 'min(380px, calc(100vw - 32px))',
                height: 'min(640px, calc(100vh - 128px))',
                '@supports (height: 100dvh)': { height: 'min(640px, calc(100dvh - 128px))' },
                borderRadius: '20px'
              }),
          ...(isClosed && {
            visibility: 'hidden',
            opacity: 0,
            transform: 'scale(0.9) translateY(12px)',
            pointerEvents: 'none'
          }),
          ...(!isClosed && { visibility: 'visible', opacity: 1, transform: 'none' })
        }}
      >
        <ChatWindow
          surface={surface}
          isMobile={isMobile}
          isFullscreen={isFullscreen}
          onMinimize={minimize}
          onToggleFullscreen={toggleFullscreen}
          settings={settings}
          onChangeSettings={setSettings}
          onUnread={handleUnread}
        />
      </Paper>

      <Zoom in={!isFullscreen} unmountOnExit>
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: (t) => t.zIndex.modal + 1
          }}
        >
          <Fab
            ref={fabRef}
            color="primary"
            aria-label={
              isClosed
                ? unreadCount > 0
                  ? `Open support chat (${unreadCount} unread message${unreadCount === 1 ? '' : 's'})`
                  : 'Open support chat'
                : 'Minimize support chat'
            }
            onClick={isClosed ? open : minimize}
          >
            {isClosed ? <NorthStarIcon /> : <CloseIcon />}
          </Fab>
        </Badge>
      </Zoom>
    </ThemeProvider>
  );
}

export default SupportWidget;
