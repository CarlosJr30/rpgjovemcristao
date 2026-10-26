import Links from './links';

export default async function Page({ searchParams }) {
  const query = await searchParams;
  return (
    <Links count={query.links === '4' ? 4 : 6} guarded={query.guard === '1'} />
  );
}
