'use client';

import { useEffect, useRef, useState } from 'react';
import { Portal } from '@/components/Portal';
import type { ArMenuItem } from '@/components/Menu/ar';

interface ARViewerOverlayProps {
  item: ArMenuItem | null;
  onClose: () => void;
}

type ViewerState = 'loading' | 'ready' | 'error';

export function ARViewerOverlay({ item, onClose }: ARViewerOverlayProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>('loading');
  const [moduleReady, setModuleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('@google/model-viewer')
      .then(() => {
        if (!cancelled) setModuleReady(true);
      })
      .catch(() => {
        if (!cancelled) setViewerState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    setViewerState('loading');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [item]);

  useEffect(() => {
    if (!item || !moduleReady) return;

    const el = viewerRef.current;
    if (!el) return;

    const onLoad = () => setViewerState('ready');
    const onError = () => setViewerState('error');

    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [item, moduleReady]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex flex-col bg-gray-950">
        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-orange-400">
              AR Preview
            </p>
            <h2 className="truncate font-display text-lg font-bold text-white">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
            aria-label="Close AR viewer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="relative min-h-0 flex-1">
          {viewerState === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm font-sans text-gray-400">Loading 3D model…</p>
            </div>
          )}

          {viewerState === 'error' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-display text-lg font-bold text-white">Couldn&apos;t load this model</p>
              <p className="max-w-sm text-sm font-sans text-gray-400 leading-relaxed">
                Check that the GLB URL is public, CORS is enabled on your S3 bucket, and the file ends in .glb or .gltf.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-sans font-semibold text-white"
              >
                Go back
              </button>
            </div>
          )}

          {moduleReady && (
            <model-viewer
              ref={(el) => {
                viewerRef.current = el;
              }}
              src={item.ar_model_url}
              poster={item.image_url ?? undefined}
              alt={`3D model of ${item.name}`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls
              touch-action="pan-y"
              auto-rotate
              loading="eager"
              reveal="auto"
              interaction-prompt="auto"
              shadow-intensity="1"
              className="h-full w-full bg-gray-950"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

        <footer className="shrink-0 border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-sm font-sans text-gray-300">
            Drag to rotate. On your phone, tap the AR button to place it on your table.
          </p>
        </footer>
      </div>
    </Portal>
  );
}
