'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageCardProps {
  src: string;
  alt: string;
  caption?: string;
  hint?: string;
  maxWidth?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ImageCard({ src, alt, caption, hint, maxWidth }: ImageCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animState, setAnimState] = useState<'entering' | 'open' | 'leaving' | 'closed'>('closed');
  const imgRef = useRef<HTMLImageElement>(null);
  const [sourceTransform, setSourceTransform] = useState('none');

  // Calculate transform to move lightbox image from flex-centered position to source position
  function computeTransform(rect: Rect, el: HTMLImageElement): string {
    const naturalW = el.naturalWidth || rect.width;
    const naturalH = el.naturalHeight || rect.height;
    if (!naturalW || !naturalH) return 'none';

    const aspect = naturalW / naturalH;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 40;
    const containerW = vw - padding * 2;
    const containerH = vh - padding * 2;

    let targetW = containerW;
    let targetH = targetW / aspect;
    if (targetH > containerH) {
      targetH = containerH;
      targetW = targetH * aspect;
    }

    const dx = rect.left + rect.width / 2 - vw / 2;
    const dy = rect.top + rect.height / 2 - vh / 2;
    const scale = rect.width / targetW;

    return `translate(${dx}px, ${dy}px) scale(${scale})`;
  }

  const close = useCallback(() => {
    const el = imgRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const r = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      setSourceTransform(computeTransform(r, el));
    }
    setAnimState('leaving');
    setTimeout(() => {
      setIsOpen(false);
      setAnimState('closed');
    }, 250);
  }, []);

  const open = useCallback(() => {
    const el = imgRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const r = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      setSourceTransform(computeTransform(r, el));
    }
    setIsOpen(true);
    setAnimState('entering');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimState('open');
      });
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  const isExpanded = animState === 'open';

  const lightboxImgStyle: React.CSSProperties = {
    transform: isExpanded ? 'none' : sourceTransform,
    transition: animState === 'entering' ? 'none' : 'transform 250ms cubic-bezier(0.2, 0, 0.2, 1)',
    cursor: 'zoom-out',
    borderRadius: '8px',
  };

  return (
    <>
      <div className="my-8 mx-auto" style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}>
        <div className="rounded-xl border border-background-border bg-background-tertiary overflow-hidden">
          {hint && <p className="text-sm text-text-secondary text-center px-4 pt-3 mb-0">{hint}</p>}
          <div className="p-3">
            <button
              type="button"
              className="block w-full cursor-zoom-in transition-opacity hover:opacity-90"
              onClick={open}
              aria-label={`Увеличить: ${alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- using standard img for MDX content */}
              <img
                ref={imgRef}
                src={src}
                alt={alt}
                className="w-full h-auto rounded-lg"
                style={{ visibility: isOpen ? 'hidden' : 'visible' }}
              />
            </button>
          </div>
          {caption && (
            <p className="text-[13px]! text-text-secondary text-center pb-0! mb-3!">{caption}</p>
          )}
        </div>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 250ms cubic-bezier(0.2, 0, 0.2, 1)',
            }}
          />
          <div
            className="fixed inset-0 z-[51] flex items-center justify-center p-10 cursor-zoom-out"
            onClick={close}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox image */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={close}
              style={lightboxImgStyle}
            />
          </div>
        </>
      )}
    </>
  );
}
