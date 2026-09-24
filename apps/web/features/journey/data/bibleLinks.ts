export type BibleLink = {
  id: 'genesis-2' | 'genesis-3';
  label: string;
  reference: string;
  url: string;
  source: 'YouVersion';
  translation: 'NVI';
};

export const BIBLE_LINKS = {
  genesis2: {
    id: 'genesis-2',
    label: 'Gênesis 2',
    reference: 'Gênesis 2',
    url: 'https://www.bible.com/pt/bible/129/GEN.2.NVI',
    source: 'YouVersion',
    translation: 'NVI',
  },
  genesis3: {
    id: 'genesis-3',
    label: 'Gênesis 3',
    reference: 'Gênesis 3',
    url: 'https://www.bible.com/pt/bible/129/GEN.3.NVI',
    source: 'YouVersion',
    translation: 'NVI',
  },
} as const satisfies Record<string, BibleLink>;

export const bibleLinkForReference = (reference: string): BibleLink =>
  reference.trim().startsWith('Gênesis 3') ? BIBLE_LINKS.genesis3 : BIBLE_LINKS.genesis2;
