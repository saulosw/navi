export function parseUsername(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(normalized)) throw new Error('Invalid username');
  return normalized;
}
