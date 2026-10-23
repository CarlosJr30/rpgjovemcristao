'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { storyRepository } from '../../lib/supabase/repositories/story-repository';
import type { StoryProgress } from './progression';

type Snapshot = {
  owner: string;
  records: StoryProgress[];
  error: string;
  loading: boolean;
};
export function useStoryProgress(travelerId: string) {
  const auth = useAuth();
  const owner = `${auth.user?.id ?? ''}:${travelerId}`;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (auth.status !== 'signedIn') return;
    let cancelled = false;
    storyRepository
      .list(travelerId)
      .then((records) => {
        if (!cancelled)
          setSnapshot({ owner, records, error: '', loading: false });
      })
      .catch(() => {
        if (!cancelled)
          setSnapshot({
            owner,
            records: [],
            error:
              'Não foi possível consultar o progresso oficial. Seu histórico do Jardim foi preservado.',
            loading: false,
          });
      });
    return () => {
      cancelled = true;
    };
  }, [auth.status, owner, travelerId, revision]);
  // Never render another account's or traveler's data during an identity switch.
  if (auth.status !== 'signedIn')
    return {
      records: [],
      error: 'Entre com sua conta para consultar o progresso.',
      loading: false,
      refresh,
    };
  if (!snapshot || snapshot.owner !== owner)
    return { records: [], error: '', loading: true, refresh };
  return { ...snapshot, refresh };
}
