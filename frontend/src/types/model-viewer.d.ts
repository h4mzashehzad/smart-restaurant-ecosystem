import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    src?: string;
    poster?: string;
    alt?: string;
    ar?: boolean | '';
    'ar-modes'?: string;
    'ar-scale'?: 'fixed' | 'auto';
    'camera-controls'?: boolean | '';
    'touch-action'?: string;
    'auto-rotate'?: boolean | '';
    loading?: 'auto' | 'lazy' | 'eager';
    reveal?: 'auto' | 'interaction' | 'manual';
    'environment-image'?: string;
    'shadow-intensity'?: string;
    'interaction-prompt'?: string;
  },
  HTMLElement
>;

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerProps;
    }
  }
}

export {};
