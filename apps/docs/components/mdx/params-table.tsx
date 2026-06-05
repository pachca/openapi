import type { ReactNode } from 'react';

/**
 * Wraps a markdown table with fixed-width first columns (parameter / type),
 * letting the description column take the remaining space.
 */
export function ParamsTable({ children }: { children: ReactNode }) {
  return <div className="params-table my-6 overflow-x-auto">{children}</div>;
}
