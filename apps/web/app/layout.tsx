import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GAME_NAME } from '@rpg/shared';
import './globals.css';
import { Providers } from './providers';
import { isArenaPreview } from '../lib/arena-preview';

export const metadata: Metadata = {
  title: GAME_NAME,
  description:
    'Crie seu Viajante e descubra o primeiro horizonte de uma jornada pelas histórias bíblicas.',
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {isArenaPreview() ? children : <Providers>{children}</Providers>}
      </body>
    </html>
  );
}
