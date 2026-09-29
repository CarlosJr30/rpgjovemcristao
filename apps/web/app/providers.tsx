'use client';

import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../lib/supabase/auth-context';

function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'loading') {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Preparando sua jornada…</p>
      </main>
    );
  }
  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
