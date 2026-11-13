// Presentation switch only. The database independently authorizes every request.
export function communityCreationTestUI() {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_CREATION_TEST === '1' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      'https://wkdvdzfkbwvhyjmamrsg.supabase.co'
  );
}
