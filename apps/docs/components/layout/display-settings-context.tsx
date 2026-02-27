'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type SchemaDetail = 'full' | 'compact' | 'minimal';

interface DisplaySettings {
  schemaDetail: SchemaDetail;
  setSchemaDetail: (value: SchemaDetail) => void;
  showSchemaExamples: boolean;
  showDescriptions: boolean;
}

const DisplaySettingsContext = createContext<DisplaySettings>({
  schemaDetail: 'full',
  setSchemaDetail: () => {},
  showSchemaExamples: true,
  showDescriptions: true,
});

const STORAGE_KEY = 'display-schema-detail';

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [schemaDetail, setSchemaDetailState] = useState<SchemaDetail>('full');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SchemaDetail | null;
    if (saved && ['full', 'compact', 'minimal'].includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- required for hydration safety: reading localStorage on mount
      setSchemaDetailState(saved);
    }
  }, []);

  const setSchemaDetail = (value: SchemaDetail) => {
    setSchemaDetailState(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const showDescriptions = schemaDetail !== 'minimal';
  const showSchemaExamples = schemaDetail === 'full';

  return (
    <DisplaySettingsContext
      value={{ schemaDetail, setSchemaDetail, showSchemaExamples, showDescriptions }}
    >
      {children}
    </DisplaySettingsContext>
  );
}

export function useDisplaySettings() {
  return useContext(DisplaySettingsContext);
}
