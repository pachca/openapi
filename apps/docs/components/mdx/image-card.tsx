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

const DISMISS_THRESHOLD = 100;

export function ImageCard({ src, alt, caption, hint, maxWidth }: ImageCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animState, setAnimState] = useState<'entering' | 'open' | 'leaving' | 'closed'>('closed');
  const imgRef = useRef<HTMLImageElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxImgRef = useRef<HTMLImageElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [sourceTransform, setSourceTransform] = useState('none');

  // Zoom state in ref for direct DOM manipulation (no React re-renders per frame)
  const zoomRef = useRef({ scale: 1, panX: 0, panY: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const dragDistRef = useRef(0);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isPanningRef = useRef(false);
  const lastTapRef = useRef(0);

  // Swipe-to-dismiss state
  const dismissRef = useRef({ active: false, startY: 0, currentY: 0 });

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
    const s = rect.width / targetW;

    return `translate(${dx}px, ${dy}px) scale(${s})`;
  }

  // Apply zoom transform directly to DOM — no React re-render, instant response
  const applyZoom = useCallback((animate = false) => {
    const el = lightboxImgRef.current;
    if (!el) return;
    const { scale, panX, panY } = zoomRef.current;
    el.style.transition = animate ? 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)' : 'none';
    const zoomed = scale > 1.01;
    el.style.transform = zoomed ? `translate3d(${panX}px, ${panY}px, 0) scale(${scale})` : 'none';
    el.style.willChange = zoomed ? 'transform' : '';
    setIsZoomed(zoomed);

    const container = lightboxRef.current;
    if (container) {
      container.style.cursor = zoomed ? 'grab' : 'zoom-out';
    }
  }, []);

  // Apply dismiss visual: shift image down, scale it, fade backdrop
  const applyDismiss = useCallback((dy: number) => {
    const el = lightboxImgRef.current;
    const bd = backdropRef.current;
    if (!el) return;
    const absDy = Math.abs(dy);
    const imgScale = Math.max(0.8, 1 - absDy / 1000);
    const opacity = Math.max(0, 1 - absDy / 300);
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px) scale(${imgScale})`;
    el.style.willChange = 'transform';
    if (bd) {
      bd.style.transition = 'none';
      bd.style.opacity = String(opacity);
    }
  }, []);

  // Snap back from dismiss
  const snapBack = useCallback(() => {
    const el = lightboxImgRef.current;
    const bd = backdropRef.current;
    if (el) {
      el.style.transition = 'transform 250ms cubic-bezier(0.2, 0, 0.2, 1)';
      el.style.transform = 'none';
      el.style.willChange = '';
    }
    if (bd) {
      bd.style.transition = 'opacity 250ms cubic-bezier(0.2, 0, 0.2, 1)';
      bd.style.opacity = '1';
    }
    dismissRef.current.active = false;
  }, []);

  const zoomAt = useCallback(
    (cx: number, cy: number, factor: number) => {
      const z = zoomRef.current;
      const vw = window.innerWidth / 2;
      const vh = window.innerHeight / 2;
      const newScale = Math.max(1, Math.min(5, z.scale * factor));

      if (newScale <= 1) {
        zoomRef.current = { scale: 1, panX: 0, panY: 0 };
      } else {
        const ratio = newScale / z.scale;
        zoomRef.current = {
          scale: newScale,
          panX: (cx - vw) * (1 - ratio) + z.panX * ratio,
          panY: (cy - vh) * (1 - ratio) + z.panY * ratio,
        };
      }
      applyZoom(false);
    },
    [applyZoom]
  );

  const resetZoom = useCallback(
    (animate = true) => {
      zoomRef.current = { scale: 1, panX: 0, panY: 0 };
      applyZoom(animate);
    },
    [applyZoom]
  );

  // Dismiss close: animate image back to source thumbnail position
  const dismissClose = useCallback(() => {
    const el = lightboxImgRef.current;
    const bd = backdropRef.current;
    const srcEl = imgRef.current;
    if (el && srcEl) {
      const rect = srcEl.getBoundingClientRect();
      const r = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      const targetTransform = computeTransform(r, srcEl);
      el.style.transition = 'transform 250ms cubic-bezier(0.2, 0, 0.2, 1)';
      el.style.transform = targetTransform;
    }
    if (bd) {
      bd.style.transition = 'opacity 250ms cubic-bezier(0.2, 0, 0.2, 1)';
      bd.style.opacity = '0';
    }
    setTimeout(() => {
      setIsOpen(false);
      setAnimState('closed');
    }, 250);
  }, []);

  const close = useCallback(() => {
    resetZoom(false);
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
  }, [resetZoom]);

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

  // Set initial zoom transform when lightbox opens
  useEffect(() => {
    if (animState === 'open') {
      zoomRef.current = { scale: 1, panX: 0, panY: 0 };
      applyZoom(false);
    }
  }, [animState, applyZoom]);

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

  // Wheel zoom
  useEffect(() => {
    const container = lightboxRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      zoomAt(e.clientX, e.clientY, factor);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen, zoomAt]);

  // Touch: pinch-to-zoom, pan, and swipe-to-dismiss
  useEffect(() => {
    const container = lightboxRef.current;
    if (!container || !isOpen) return;

    let lastDist = 0;
    let lastCenter = { x: 0, y: 0 };
    let lastTouch = { x: 0, y: 0 };
    let startTouch = { x: 0, y: 0 };
    let touchPanning = false;
    let gestureDecided = false; // whether we decided dismiss vs. ignore for single-finger

    const getDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastDist = getDist(e.touches[0], e.touches[1]);
        lastCenter = getCenter(e.touches[0], e.touches[1]);
        touchPanning = false;
        gestureDecided = false;
        // Cancel dismiss if pinch starts
        if (dismissRef.current.active) {
          dismissRef.current.active = false;
          snapBack();
        }
      } else if (e.touches.length === 1) {
        startTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchPanning = true;
        gestureDecided = false;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDist = getDist(e.touches[0], e.touches[1]);
        const newCenter = getCenter(e.touches[0], e.touches[1]);

        zoomAt(newCenter.x, newCenter.y, newDist / lastDist);

        const z = zoomRef.current;
        z.panX += newCenter.x - lastCenter.x;
        z.panY += newCenter.y - lastCenter.y;
        applyZoom(false);

        lastDist = newDist;
        lastCenter = newCenter;
      } else if (e.touches.length === 1 && touchPanning) {
        const dx = e.touches[0].clientX - lastTouch.x;
        const dy = e.touches[0].clientY - lastTouch.y;

        if (zoomRef.current.scale > 1) {
          // Zoomed in: pan
          e.preventDefault();
          zoomRef.current.panX += dx;
          zoomRef.current.panY += dy;
          applyZoom(false);
        } else {
          // At 1x: decide between dismiss (vertical) or ignore (horizontal)
          if (!gestureDecided) {
            const totalDx = Math.abs(e.touches[0].clientX - startTouch.x);
            const totalDy = Math.abs(e.touches[0].clientY - startTouch.y);
            // Need at least 10px movement to decide
            if (totalDx + totalDy > 10) {
              gestureDecided = true;
              if (totalDy > totalDx) {
                // Vertical: start dismiss
                dismissRef.current.active = true;
                dismissRef.current.startY = startTouch.y;
              }
              // else horizontal: ignore
            }
          }
          if (dismissRef.current.active) {
            e.preventDefault();
            const dismissDy = e.touches[0].clientY - dismissRef.current.startY;
            dismissRef.current.currentY = dismissDy;
            applyDismiss(dismissDy);
          }
        }
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onEnd = () => {
      // Check dismiss
      if (dismissRef.current.active) {
        const dy = dismissRef.current.currentY;
        if (Math.abs(dy) > DISMISS_THRESHOLD) {
          dismissClose();
        } else {
          snapBack();
        }
        dismissRef.current.active = false;
        dismissRef.current.currentY = 0;
      }
      touchPanning = false;
      gestureDecided = false;
      lastDist = 0;
    };

    container.addEventListener('touchstart', onStart, { passive: false });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEnd);
    container.addEventListener('touchcancel', onEnd);

    return () => {
      container.removeEventListener('touchstart', onStart);
      container.removeEventListener('touchmove', onMove);
      container.removeEventListener('touchend', onEnd);
      container.removeEventListener('touchcancel', onEnd);
    };
  }, [isOpen, zoomAt, applyZoom, applyDismiss, snapBack, dismissClose]);

  // Mouse drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      if (isZoomed) {
        // Pan when zoomed
        e.preventDefault();
        isPanningRef.current = true;
        dragDistRef.current = 0;
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: zoomRef.current.panX,
          panY: zoomRef.current.panY,
        };
        const container = lightboxRef.current;
        if (container) container.style.cursor = 'grabbing';
      } else {
        // Start potential dismiss drag at 1x
        dragDistRef.current = 0;
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: 0, panY: 0 };
        isPanningRef.current = true;
      }
    },
    [isZoomed]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      dragDistRef.current = Math.abs(dx) + Math.abs(dy);

      if (isZoomed) {
        zoomRef.current.panX = panStartRef.current.panX + dx;
        zoomRef.current.panY = panStartRef.current.panY + dy;
        applyZoom(false);
      } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        // Mouse dismiss drag at 1x
        dismissRef.current.active = true;
        applyDismiss(dy);
      }
    },
    [isZoomed, applyZoom, applyDismiss]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;

    if (dismissRef.current.active) {
      const el = lightboxImgRef.current;
      // Calculate dy from current transform
      const style = el?.style.transform || '';
      const match = style.match(/translateY\(([-\d.]+)px\)/);
      const dy = match ? parseFloat(match[1]) : 0;
      if (Math.abs(dy) > DISMISS_THRESHOLD) {
        dismissClose();
      } else {
        snapBack();
      }
      dismissRef.current.active = false;
      return;
    }

    const container = lightboxRef.current;
    if (container) {
      container.style.cursor = zoomRef.current.scale > 1.01 ? 'grab' : 'zoom-out';
    }
  }, [snapBack, dismissClose]);

  // Click: close or reset zoom (ignore if was drag/dismiss)
  const handleLightboxClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragDistRef.current > 5) {
        dragDistRef.current = 0;
        return;
      }
      if (isZoomed) {
        e.stopPropagation();
        resetZoom(true);
      } else {
        close();
      }
    },
    [isZoomed, close, resetZoom]
  );

  // Double-click to toggle 2x zoom at point
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (zoomRef.current.scale > 1.01) {
        resetZoom(true);
      } else {
        const vw = window.innerWidth / 2;
        const vh = window.innerHeight / 2;
        const newScale = 2;
        zoomRef.current = {
          scale: newScale,
          panX: (e.clientX - vw) * (1 - newScale),
          panY: (e.clientY - vh) * (1 - newScale),
        };
        applyZoom(true);
      }
    },
    [resetZoom, applyZoom]
  );

  // Double-tap for touch
  const handleTouchEndTap = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) return;
      const now = Date.now();
      const delta = now - lastTapRef.current;
      lastTapRef.current = now;
      if (delta < 300 && delta > 0) {
        const touch = e.changedTouches[0];
        if (zoomRef.current.scale > 1.01) {
          resetZoom(true);
        } else {
          const vw = window.innerWidth / 2;
          const vh = window.innerHeight / 2;
          const newScale = 2;
          zoomRef.current = {
            scale: newScale,
            panX: (touch.clientX - vw) * (1 - newScale),
            panY: (touch.clientY - vh) * (1 - newScale),
          };
          applyZoom(true);
        }
      }
    },
    [resetZoom, applyZoom]
  );

  const isExpanded = animState === 'open';

  const lightboxImgStyle: React.CSSProperties = isExpanded
    ? {
        transformOrigin: 'center center',
        borderRadius: '8px',
        userSelect: 'none' as const,
      }
    : {
        transform: sourceTransform,
        transformOrigin: 'center center',
        transition:
          animState === 'entering' ? 'none' : 'transform 250ms cubic-bezier(0.2, 0, 0.2, 1)',
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
            ref={backdropRef}
            className="fixed inset-0 z-50 bg-background"
            onClick={!isZoomed ? close : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 250ms cubic-bezier(0.2, 0, 0.2, 1)',
            }}
          />
          <div
            ref={lightboxRef}
            className="fixed inset-0 z-[51] flex items-center justify-center p-10"
            style={{ cursor: 'zoom-out', touchAction: 'none' }}
            onClick={handleLightboxClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchEnd={handleTouchEndTap}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox image */}
            <img
              ref={lightboxImgRef}
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              draggable={false}
              style={lightboxImgStyle}
            />
          </div>
        </>
      )}
    </>
  );
}
