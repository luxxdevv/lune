// Shared text keeps the existing callers while using normal, selectable lettering.
export function MinecraftText({ text, height = 14 }: { text: string; height?: number; iron?: boolean; texture?: string; shadow?: boolean }) {
  return <span className="site-text" style={{ fontSize: Math.max(14, height) }}>{text}</span>;
}
