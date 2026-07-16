'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Portal } from '@/components/Portal';
import { toProxiedArModelUrl, type ArMenuItem } from '@/components/Menu/ar';

interface ARViewerOverlayProps {
  item: ArMenuItem | null;
  onClose: () => void;
}

type ViewerState = 'loading' | 'ready' | 'error';

const LOAD_TIMEOUT_MS = 45_000;

export function ARViewerOverlay({ item, onClose }: ARViewerOverlayProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [viewerEpoch, setViewerEpoch] = useState(0);
  const [viewerState, setViewerState] = useState<ViewerState>('loading');
  const [moduleReady, setModuleReady] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const modelSrc = useMemo(
    () => (item ? toProxiedArModelUrl(item.ar_model_url) : null),
    [item]
  );

  useEffect(() => {
    let cancelled = false;
    import('@google/model-viewer')
      .then(() => {
        if (!cancelled) setModuleReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorDetail('Failed to load the AR viewer library.');
          setViewerState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    setViewerState('loading');
    setErrorDetail(null);
    setProgress(0);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  useEffect(() => {
    if (!item || viewerState !== 'loading') return;
    const timer = window.setTimeout(() => {
      setErrorDetail(
        'Timed out loading the 3D model. Check that the GLB is reachable and not too large for mobile.'
      );
      setViewerState('error');
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [item, viewerState, modelSrc]);

  // Attach load listeners AFTER model-viewer is in the DOM (fixes stuck Loading state).
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !moduleReady || !modelSrc) return;

    const markReady = () => {
      setProgress(1);
      setViewerState('ready');
    };
    const markError = () => {
      setErrorDetail(
        'Could not load this model. Confirm the URL is a public HTTPS .glb/.gltf file.'
      );
      setViewerState('error');
    };
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress?: number }>).detail;
      if (typeof detail?.totalProgress === 'number') {
        setProgress(detail.totalProgress);
        if (detail.totalProgress >= 1) markReady();
      }
    };

    const maybeLoaded = el as HTMLElement & { loaded?: boolean };
    if (maybeLoaded.loaded) {
      markReady();
    }

    el.addEventListener('load', markReady);
    el.addEventListener('error', markError);
    el.addEventListener('progress', onProgress);

    return () => {
      el.removeEventListener('load', markReady);
      el.removeEventListener('error', markError);
      el.removeEventListener('progress', onProgress);
    };
  }, [moduleReady, modelSrc, viewerEpoch]);

  const setViewerNode = useCallback((el: HTMLElement | null) => {
    viewerRef.current = el;
    if (el) setViewerEpoch((n) => n + 1);
  }, []);

  if (!item || !modelSrc) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex flex-col bg-gray-950">
        <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950/70">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="text-sm font-sans text-gray-300">Loading 3D model…</p>
              {progress > 0 && (
                <p className="text-xs font-sans text-gray-500">{Math.round(progress * 100)}%</p>
              )}
            </div>
          )}

          {viewerState === 'error' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center bg-gray-950">
              <p className="font-display text-lg font-bold text-white">Couldn&apos;t load this model</p>
              <p className="max-w-sm text-sm font-sans text-gray-400 leading-relaxed">
                {errorDetail ??
                  'Check that the GLB URL is public HTTPS and ends in .glb or .gltf.'}
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
              ref={setViewerNode}
              key={modelSrc}
              src={modelSrc}
              poster={item.image_url ?? undefined}
              alt={`3D model of ${item.name}`}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls=""
              touch-action="pan-y"
              auto-rotate=""
              loading="eager"
              reveal="auto"
              interaction-prompt="auto"
              shadow-intensity="1"
              style={{ width: '100%', height: '100%', backgroundColor: '#030712' }}
            />
          )}
        </div>

        <footer className="relative z-20 shrink-0 border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-sm font-sans text-gray-300">
            Drag to rotate. On your phone, tap the AR button to place it on your table.
          </p>
        </footer>
      </div>
    </Portal>
  );
}
