import React from 'react';
import { toSlug } from '@/lib/utils/transliterate';

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="step-item relative pl-10 pb-6 last:pb-0">
      <h3
        id={toSlug(title)}
        className="text-[17px] font-bold! text-text-primary h-7 flex items-center mb-2!"
      >
        {title}
      </h3>
      <div className="text-[15px] text-text-primary leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="steps-list my-8 not-prose">{children}</div>;
}
