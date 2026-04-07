'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react';

interface CopiedTooltipProps {
  children: React.ReactNode;
  open: boolean;
}

export function CopiedTooltip({ children, open }: CopiedTooltipProps) {
  return (
    <Tooltip.Root open={open}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="center"
          sideOffset={2}
          collisionPadding={8}
          className="z-50 pointer-events-none animate-tooltip rounded-lg px-2.5 py-1.5 shadow-xl border border-glass-heavy-border bg-glass-heavy backdrop-blur-md text-text-primary text-[12px] font-semibold whitespace-nowrap"
        >
          Скопировано
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
