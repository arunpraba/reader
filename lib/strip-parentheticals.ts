/** Remove balanced parentheticals. Nested groups peel inside-out. Unbalanced "(" stays. */
export function stripParentheticals(text: string) {
  let current = text;
  const inner = /\([^()]*\)/g;
  let next = current.replace(inner, " ");
  while (next !== current) {
    current = next;
    next = current.replace(inner, " ");
  }
  return current.replace(/\s+/g, " ").trim();
}
