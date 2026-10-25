export function generateStaticParams() {
  return Array.from({ length: 6 }, (_, i) => ({ id: String(i) }));
}

export default async function Target({ params }) {
  const { id } = await params;
  return <h1>Prefetch target {id}</h1>;
}
