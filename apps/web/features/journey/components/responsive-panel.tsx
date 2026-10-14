'use client';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import mobile from './mobile-game-mode.module.css';

const query = '(max-width: 1024px)';
const snapshot = () => window.matchMedia?.(query).matches ?? false;
const subscribe = (notify: () => void) => {
  const media = window.matchMedia?.(query);
  if (!media) return () => {};
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
export function ResponsivePanel({
  title,
  children,
  expanded: controlled,
  onExpandedChange,
  id,
}: {
  title: string;
  children: ReactNode;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  id?: string;
}) {
  const compact = useCompactGameLayout();
  const [expanded, setExpanded] = useState(false);
  return (
    <details
      id={id}
      className={mobile.responsivePanel}
      open={!compact || (controlled ?? expanded)}
      onToggle={(event) => {
        if (compact)
          (onExpandedChange ?? setExpanded)(event.currentTarget.open);
      }}
    >
      <summary>{title}</summary>
      {children}
    </details>
  );
}
export function useCompactGameLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
