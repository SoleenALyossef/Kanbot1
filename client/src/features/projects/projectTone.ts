/** Stable colour class (tone-0…tone-5) for a project key. */
export function projectTone(key = ''): string {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return `tone-${hash % 6}`;
}
