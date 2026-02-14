'use client';

import React, { useState } from 'react';
import { ChevronRight, Folder, File } from 'lucide-react';

interface TreeFolderProps {
  name: string;
  defaultOpen?: boolean;
  openable?: boolean;
  children?: React.ReactNode;
}

interface TreeFileProps {
  name: string;
}

export function TreeFolder({
  name,
  defaultOpen = false,
  openable = true,
  children,
}: TreeFolderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (openable) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="tree-folder">
      <div
        className={`flex items-center gap-2 py-1 rounded transition-colors ${
          openable ? 'cursor-pointer hover:bg-background-secondary' : ''
        }`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (openable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
        role={openable ? 'button' : undefined}
        tabIndex={openable ? 0 : undefined}
        aria-expanded={openable ? isOpen : undefined}
      >
        {openable && (
          <ChevronRight
            strokeWidth={2.5}
            className={`w-3.5 h-3.5 shrink-0 text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        )}
        {!openable && <span className="w-4 shrink-0" />}
        <Folder strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
        <span className="text-[13px] text-text-primary font-medium">{name}</span>
      </div>
      {isOpen && children && (
        <div className="ml-7 border-l border-background-border">{children}</div>
      )}
    </div>
  );
}

export function TreeFile({ name }: TreeFileProps) {
  return (
    <div className="tree-file flex items-center gap-2 py-1">
      <span className="w-3.5 shrink-0" />
      <File strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
      <span className="text-[13px] text-text-primary">{name}</span>
    </div>
  );
}

interface TreeProps {
  children: React.ReactNode;
}

export function Tree({ children }: TreeProps) {
  return (
    <div className="tree my-6 px-3 py-2 rounded-lg border border-background-border bg-background font-mono not-prose">
      {children}
    </div>
  );
}
