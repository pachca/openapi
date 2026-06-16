'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Shared selected-language state for code examples and the client panel.
 *
 * Persists to localStorage and broadcasts a custom event so every switcher on
 * the page (dropdowns in <CodeExamples>, tabs in <ApiClientPanel>) stays in
 * sync live, and the choice is remembered across pages.
 *
 * Pass `pinned` to lock an instance to a specific language (e.g. the home hero):
 * it won't follow the shared value, but selecting in it still updates others.
 */
const STORAGE_KEY = 'pachca-docs-code-lang';
const CHANGE_EVENT = 'pachca-code-lang-change';

export function useCodeLang(
  fallback: string,
  pinned?: string
): readonly [string, (lang: string) => void] {
  const [lang, setLangState] = useState<string>(pinned ?? fallback);

  useEffect(() => {
    if (pinned) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLangState(saved); // eslint-disable-line react-hooks/set-state-in-effect

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setLangState(detail);
    };
    const onStorage = () => {
      const next = localStorage.getItem(STORAGE_KEY);
      if (next) setLangState(next);
    };

    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [pinned]);

  const setLang = useCallback((next: string) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
    } catch {
      // localStorage unavailable — selection still updates locally
    }
  }, []);

  return [lang, setLang] as const;
}
