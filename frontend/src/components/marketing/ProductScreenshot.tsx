'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { Maximize2, X } from 'lucide-react';
import { productScreens, type ScreenName } from '@/lib/marketing-content';
export function ProductScreenshot({
  screen,
  caption,
  priority = false,
  className = '',
}: {
  screen: ScreenName;
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  const shot = productScreens[screen];
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className={`product-shot ${className}`}>
      <button
        className="product-shot-button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Expand: ${shot.alt}`}
      >
        <Image
          src={`/photos/${shot.file}`}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          sizes="(max-width: 640px) 90vw, (max-width: 960px) 45vw, 650px"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
        <span className="product-shot-expand" aria-hidden="true">
          <Maximize2 size={16} />
        </span>
      </button>
      {caption && <figcaption>{caption}</figcaption>}
      <dialog
        ref={dialog}
        className="product-shot-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        aria-label={shot.alt}
      >
        <button
          className="product-shot-close"
          onClick={() => dialog.current?.close()}
          aria-label="Close expanded image"
          autoFocus
        >
          <X size={22} />
        </button>
        <Image
          src={`/photos/${shot.file}`}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          sizes="90vw"
        />
        <p>{caption ?? 'Actual Table.com.pk product screen. Example data shown.'}</p>
      </dialog>
    </figure>
  );
}
