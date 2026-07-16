export interface ArMenuItem {
  name: string;
  ar_model_url: string;
  image_url?: string | null;
}

/** True when item has a valid HTTPS GLB/GLTF URL for WebAR. */
export function hasArModel(item: { ar_model_url?: string | null }): boolean {
  const url = item?.ar_model_url?.trim();
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const path = parsed.pathname.toLowerCase();
    return path.endsWith('.glb') || path.endsWith('.gltf');
  } catch {
    return false;
  }
}

export function toArMenuItem(item: {
  name: string;
  ar_model_url?: string | null;
  image_url?: string | null;
}): ArMenuItem | null {
  if (!hasArModel(item)) return null;
  return {
    name: item.name,
    ar_model_url: item.ar_model_url!.trim(),
    image_url: item.image_url ?? null,
  };
}
