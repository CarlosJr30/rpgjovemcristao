import { createRoot } from 'react-dom/client';
import { ArenaVisualLab } from './arena-visual-lab';
import '../../../app/globals.css';
if (!import.meta.env.DEV)
  throw new Error('Arena Visual Lab is development-only');
createRoot(document.getElementById('root')!).render(<ArenaVisualLab />);
