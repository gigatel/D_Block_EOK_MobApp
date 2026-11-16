/** Client-proposed ids must match ^[a-z][a-z0-9-]{0,39}$ (server re-validates). */
export const ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

/** e.g. newId('cp') → "cp-k3j9x2m1q8" — same prefixes as the website. */
export function newId(prefix: string): string {
  const suffix =
    Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
  const id = `${prefix}-${suffix}`.slice(0, 40);
  if (!ID_PATTERN.test(id)) {
    throw new Error(`Invalid id prefix: ${prefix}`);
  }
  return id;
}
