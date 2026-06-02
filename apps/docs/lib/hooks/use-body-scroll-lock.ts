'use client';

import { useEffect } from 'react';

// Блокировка скролла страницы под модалками/оверлеями. Reference-counted, чтобы
// несколько одновременных локов (если такое случится) не мешали друг другу:
// разблокировка происходит только когда снят последний лок. Ширину скроллбара
// компенсируем паддингом на body и на фиксированной шапке, чтобы контент не
// дёргался вбок (на overlay-скроллбарах macOS ширина = 0 — паддинг не ставится).

let lockCount = 0;
let saved: {
  overflow: string;
  bodyPad: string;
  header: HTMLElement | null;
  headerPad: string;
} | null = null;

function lock() {
  lockCount += 1;
  if (lockCount > 1) return; // уже заблокировано первым локом

  const { body } = document;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const header = document.querySelector('header');

  saved = {
    overflow: body.style.overflow,
    bodyPad: body.style.paddingRight,
    header,
    headerPad: header?.style.paddingRight ?? '',
  };

  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
    if (header) header.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !saved) return; // ещё есть активные локи

  const { body } = document;
  body.style.overflow = saved.overflow;
  body.style.paddingRight = saved.bodyPad;
  if (saved.header) saved.header.style.paddingRight = saved.headerPad;
  saved = null;
}

/**
 * Блокирует скролл основной страницы, пока `enabled === true`.
 *
 * Два сценария использования:
 * - компонент монтируется только когда открыт → `useBodyScrollLock()`;
 * - компонент всегда смонтирован, открытие по флагу → `useBodyScrollLock(isOpen)`.
 */
export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    lock();
    return unlock;
  }, [enabled]);
}
