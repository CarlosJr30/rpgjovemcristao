export type GuildContentKind = 'challenge' | 'lesson' | 'mission';
export type GuildContentTier = 'normal' | 'great' | 'epic' | 'extraordinary';
export type GuildContent = {
  id: string;
  guildId: string;
  kind: GuildContentKind;
  title: string;
  description: string;
  biblicalReference: string;
  bibleUrl: string;
  objective: string;
  date: string;
  theme: string;
  questions: string;
  groupActivity: string;
  practicalMission: string;
  difficulty: 'normal' | 'dificil';
  audience: 'individual' | 'collective';
  collectiveTarget: number | null;
  tier: GuildContentTier;
  createdAt: string;
};

export const GUILD_CONTENT_KEY = 'rpg-jovem-cristao:guild-content:v1';
export const GUILD_REWARDS: Record<GuildContentTier, { xp: number; coins: number }> = {
  normal: { xp: 80, coins: 25 },
  great: { xp: 240, coins: 100 },
  epic: { xp: 480, coins: 220 },
  extraordinary: { xp: 720, coins: 360 },
};

const validUrl = (url: string) => url === '' || /^https:\/\/www\.bible\.com\/[A-Za-z0-9/._-]{1,180}$/.test(url);
export function validGuildContent(value: unknown): value is GuildContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const strings = ['id', 'guildId', 'kind', 'title', 'description', 'biblicalReference', 'bibleUrl', 'objective', 'date', 'theme', 'questions', 'groupActivity', 'practicalMission', 'difficulty', 'audience', 'tier', 'createdAt'];
  if (!strings.every((key) => typeof item[key] === 'string')) return false;
  const content = item as GuildContent;
  return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(content.id) && /^[a-z0-9-]{5,64}$/.test(content.guildId) &&
    ['challenge', 'lesson', 'mission'].includes(content.kind) &&
    content.title.trim().length >= 2 && content.title.length <= 80 &&
    content.description.length <= 600 &&
    content.biblicalReference.length > 0 && content.biblicalReference.length <= 80 && validUrl(content.bibleUrl) &&
    content.objective.length <= 240 && (content.date === '' || /^\d{4}-\d{2}-\d{2}$/.test(content.date)) &&
    content.theme.length <= 80 && content.questions.length <= 500 &&
    content.groupActivity.length <= 300 && content.practicalMission.length <= 300 &&
    ['normal', 'dificil'].includes(content.difficulty) &&
    ['individual', 'collective'].includes(content.audience) &&
    (content.collectiveTarget === null || Number.isInteger(content.collectiveTarget) && content.collectiveTarget >= 2 && content.collectiveTarget <= 1000) &&
    ['normal', 'great', 'epic', 'extraordinary'].includes(content.tier) &&
    Number.isFinite(Date.parse(content.createdAt));
}

export interface GuildContentPort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function createGuildContentRepository(storage: () => GuildContentPort) {
  const list = (): GuildContent[] => {
    try {
      const raw = storage().getItem(GUILD_CONTENT_KEY);
      if (!raw || raw.length > 1024 * 1024) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(validGuildContent);
    } catch { return []; }
  };
  return {
    list: (guildId: string) => list().filter((item) => item.guildId === guildId),
    add: (item: GuildContent) => {
      if (!validGuildContent(item)) return false;
      const existing = list();
      if (existing.length >= 100 || existing.some((entry) => entry.id === item.id)) return false;
      try { storage().setItem(GUILD_CONTENT_KEY, JSON.stringify([...existing, item])); return true; }
      catch { return false; }
    },
  };
}
export const guildContentRepository = createGuildContentRepository(() => window.localStorage);
