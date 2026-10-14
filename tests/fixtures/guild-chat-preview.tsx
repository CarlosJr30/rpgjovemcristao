// Visual fixture only. No real Auth session, database or Realtime transport.
import { createRoot } from 'react-dom/client';
import { GuildChat } from '../../apps/web/features/journey/components/guild-chat';
declare global {
  interface Window {
    chatFixture: {
      account: string;
      guild: string;
      traveler: string;
      mount: () => void;
      invalidate: () => void;
      status: (online: boolean) => void;
      messages: unknown[];
      summary: {
        unread_count: number;
        last_read_sequence: number;
        can_announce: boolean;
        can_moderate: boolean;
      };
    };
  }
}
const root = createRoot(document.getElementById('root')!);
window.chatFixture.mount = () =>
  root.render(
    <GuildChat
      guildId={window.chatFixture.guild}
      travelerId={window.chatFixture.traveler}
    />,
  );
window.chatFixture.mount();
