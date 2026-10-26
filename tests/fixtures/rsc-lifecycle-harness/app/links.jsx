'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import DocumentNavigationLink from '../document-navigation-link';

export default function Links({ count, guarded }) {
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [showLate, setShowLate] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const NavigationLink = guarded ? DocumentNavigationLink : Link;
  return (
    <main>
      <h1>RSC lifecycle fixture</h1>
      <p>No authentication, database, cookies or external services.</p>
      <output data-testid="revision">{revision}</output>
      <button onClick={() => setRevision((value) => value + 1)}>
        Change local state
      </button>
      <button onClick={() => setDirty(true)}>Protect unsaved form</button>
      <button onClick={() => flushSync(() => setShowLate(true))}>
        Mount late link
      </button>
      <nav aria-label="Automatic prefetch targets">
        {Array.from({ length: count }, (_, i) => (
          <NavigationLink
            key={i}
            href={'/target/' + i}
            style={{ display: 'block', padding: 8 }}
          >
            Target {i}
          </NavigationLink>
        ))}
      </nav>
      {showLate && (
        <NavigationLink href="/target/late" data-testid="late-link">
          Link mounted after state change
        </NavigationLink>
      )}
      <Link href="/replacement" prefetch={false}>
        Client navigation
      </Link>
    </main>
  );
}
