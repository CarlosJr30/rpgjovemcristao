'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './context-panel.module.css';

/** Native modal semantics, focus containment and one scrollable reading surface. */
export function ContextPanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    const scrolling = document.documentElement.style.overflow;
    node.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      node.close();
      document.documentElement.style.overflow = scrolling;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={styles.panel}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const node = event.currentTarget;
        const controls = [
          ...node.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((control) => control.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (!first || !last) return;
        if (
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.header}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Fechar painel">
          ✕
        </button>
      </header>
      <div className={styles.content}>{open && children}</div>
    </dialog>
  );
}
