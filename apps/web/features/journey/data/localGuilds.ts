export const LOCAL_GUILDS_KEY = 'rpg-jovem-cristao:local-guilds:v1';
export const DEMO_GUILD_CODE = 'CELULA01';

export type LocalGuild = Readonly<{
  id: string;
  code: string;
  name: string;
  leaderId: string | null;
  createdAt: string;
}>;

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
const validCode = (code: string) => /^[A-Z0-9-]{6,16}$/.test(code);
function validGuild(value: unknown): value is LocalGuild {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const guild = value as Record<string, unknown>;
  return typeof guild.id === 'string' && /^[a-z0-9-]{5,64}$/.test(guild.id) &&
    typeof guild.code === 'string' && validCode(guild.code) &&
    typeof guild.name === 'string' && guild.name.trim().length >= 2 && guild.name.length <= 60 &&
    (guild.leaderId === null || typeof guild.leaderId === 'string') &&
    typeof guild.createdAt === 'string' && Number.isFinite(Date.parse(guild.createdAt));
}

export function normalizeGuildCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function createLocalGuildRepository(storage: () => StoragePort) {
  const list = (): LocalGuild[] => {
    try {
      const raw = storage().getItem(LOCAL_GUILDS_KEY);
      if (!raw || raw.length > 128_000) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(validGuild).slice(0, 50) : [];
    } catch { return []; }
  };
  const demo: LocalGuild = { id: 'guild-celula01', code: DEMO_GUILD_CODE, name: 'Célula de demonstração', leaderId: null, createdAt: '2026-01-01T00:00:00.000Z' };
  return {
    list,
    findByCode(code: string) {
      const normalized = normalizeGuildCode(code);
      return normalized === DEMO_GUILD_CODE ? demo : list().find((guild) => guild.code === normalized) ?? null;
    },
    findById(id: string) { return id === demo.id ? demo : list().find((guild) => guild.id === id) ?? null; },
    add(guild: LocalGuild) {
      if (!validGuild(guild)) return false;
      const current = list();
      if (current.some((item) => item.id === guild.id || item.code === guild.code) || current.length >= 50) return false;
      try { storage().setItem(LOCAL_GUILDS_KEY, JSON.stringify([...current, guild])); return true; }
      catch { return false; }
    },
  };
}

export const localGuildRepository = createLocalGuildRepository(() => window.localStorage);
