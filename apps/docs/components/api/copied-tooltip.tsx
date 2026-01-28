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
          className="z-50 pointer-events-none animate-tooltip bg-primary text-white text-[12px] font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-none"
        >
          Скопировано
          <Tooltip.Arrow className="fill-primary" width={8} height={4} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
