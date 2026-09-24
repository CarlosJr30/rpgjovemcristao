import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GAME_NAME } from '@rpg/shared';
import './globals.css';

export const metadata: Metadata = {
  title: GAME_NAME,
  description:
    'Crie seu Viajante e descubra o primeiro horizonte de uma jornada pelas histórias bíblicas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
