import { redirect } from 'next/navigation';

/** Preserve old bookmarks without exposing the retired combat interface. */
export default function LegacyArenaPage() {
  redirect('/journey/arena');
}
