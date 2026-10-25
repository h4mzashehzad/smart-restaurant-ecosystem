export function safeRedirect(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value))
    return fallback;
  return value;
}
