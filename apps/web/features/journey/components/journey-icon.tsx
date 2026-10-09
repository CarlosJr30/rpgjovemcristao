type IconName =
  | 'hero'
  | 'map'
  | 'garden'
  | 'equipment'
  | 'backpack'
  | 'shop'
  | 'collection'
  | 'diary'
  | 'guild'
  | 'arena';
const paths: Record<IconName, string> = {
  hero: 'M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6Z M9 11l2 2 4-4',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z M9 3v16 M15 5v16',
  garden:
    'M12 21V11 M12 15C4 15 3 9 4 4c6 0 8 4 8 8 M12 12c0-5 4-7 8-7 0 6-3 9-8 9',
  equipment: 'm6 18 12-12 3-3v5L9 20 M3 14l7 7 M4 20l-1 1 M14 3l7 7',
  backpack: 'M8 5V4a4 4 0 0 1 8 0v1 M5 7h14v14H5Z M5 12h14 M9 15h6v3H9Z',
  shop: 'M3 9h18l-2-6H5Z M5 9v12h14V9 M9 21v-7h6v7',
  collection: 'm12 2 8 10-8 10-8-10Z M4 12h16 M12 2l3 10-3 10-3-10Z',
  diary:
    'M12 5C9 3 6 3 3 4v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z M12 5v16',
  guild:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M15 5a3 3 0 0 1 0 6 M3 21v-3a6 6 0 0 1 12 0v3 M16 14a5 5 0 0 1 5 5v2',
  arena:
    'm4 3 6 3 9 12-3 3-9-12Z M3 18l5-5 M20 3l-6 3-9 12 3 3 9-12Z M16 13l5 5',
};
export function JourneyIcon({ name }: { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
