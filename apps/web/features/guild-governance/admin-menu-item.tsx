'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import {
  GOVERNANCE_PATH,
  parseGovernanceStatus,
} from '../../lib/guild-governance/contracts';
import { JourneyIcon } from '../journey/components/journey-icon';

export function AdminMenuItem({
  close,
  current,
}: {
  close: () => void;
  current: boolean;
}) {
  const auth = useAuth();
  const owner = auth.status === 'signedIn' ? auth.user?.id : undefined;
  const [result, setResult] = useState<{ owner?: string; allowed: boolean }>({
    allowed: false,
  });
  useEffect(() => {
    if (!owner) return;
    let active = true;
    let generation = 0;
    async function refresh() {
      const request = ++generation;
      try {
        const client = getSupabaseBrowserClient();
        const user = await client.auth.getUser();
        if (
          user.error ||
          user.data.user?.id !== owner ||
          user.data.user.is_anonymous
        )
          throw Error('Account changed');
        const r = await client.rpc('guild_scoped_status', {});
        if (r.error) throw Error('Unavailable');
        const status = parseGovernanceStatus(r.data);
        if (active && request === generation)
          setResult({ owner, allowed: status.administrator });
      } catch {
        if (active && request === generation)
          setResult({ owner, allowed: false });
      }
    }
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('rpg:governance-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('rpg:governance-updated', refresh);
    };
  }, [owner]);
  if (!owner || result.owner !== owner || !result.allowed) return null;
  return (
    <Link
      href={GOVERNANCE_PATH}
      prefetch={false}
      aria-current={current ? 'page' : undefined}
      onClick={close}
    >
      <i aria-hidden="true">
        <JourneyIcon name="guild" />
      </i>
      Administração
    </Link>
  );
}
