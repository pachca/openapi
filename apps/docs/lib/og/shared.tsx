import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import React from 'react';

const FONT_DIR = join(process.cwd(), 'app/api/og/fonts');

// Dark theme colors — warm stone palette (OKLCH → hex for satori)
export const OG_COLORS = {
  background: '#0e0a07', // oklch(15% 0.01 70) — canvas base
  backgroundSecondary: '#15110c', // oklch(18% 0.012 70) — section fills
  backgroundBorder: '#2c2721', // oklch(27.5% 0.012 70) — borders
  textPrimary: '#ebe7e3', // oklch(93% 0.007 70) — headings, body
  textSecondary: '#a39d97', // oklch(70% 0.012 70) — descriptions
  textTertiary: '#76706a', // oklch(55% 0.012 70) — metadata
  primary: '#ee8545', // oklch(72% 0.15 50) — brand orange
  methodGet: '#508bff', // oklch(66% 0.193 263) — GET blue
  methodPost: '#5dae5c', // oklch(68% 0.142 143.5) — POST green
  methodPut: '#c08e3b', // oklch(68% 0.116 77) — PUT amber
  methodDelete: '#e06c75', // oklch(67.1% 0.145 17) — DELETE red
  methodPatch: '#c678de', // oklch(69.4% 0.164 318) — PATCH magenta
} as const;

export const METHOD_COLORS: Record<string, string> = {
  GET: OG_COLORS.methodGet,
  POST: OG_COLORS.methodPost,
  PUT: OG_COLORS.methodPut,
  DELETE: OG_COLORS.methodDelete,
  PATCH: OG_COLORS.methodPatch,
};

// Font cache to avoid re-reading during build
let fontMediumCache: Buffer | null = null;
let fontSemiboldCache: Buffer | null = null;

async function loadFonts(): Promise<{ medium: Buffer; semibold: Buffer }> {
  if (!fontMediumCache) {
    fontMediumCache = await readFile(join(FONT_DIR, 'TT_Commons_Medium.ttf'));
  }
  if (!fontSemiboldCache) {
    fontSemiboldCache = await readFile(join(FONT_DIR, 'TT_Commons_DemiBold.ttf'));
  }
  return { medium: fontMediumCache, semibold: fontSemiboldCache };
}

// Пачка icon only (no text)
function PachkaIcon() {
  return (
    <svg width="72" height="80" viewBox="0 0 24 27" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.2803 6.81857L16.8275 0.375576C16.382 -0.0692192 15.5905 -0.127236 15.0596 0.245992L0.448277 10.518C-0.0826181 10.8912 -0.151866 11.5543 0.293609 11.9991L6.74643 18.4421C7.1919 18.8869 7.98341 18.945 8.5143 18.5717L23.1256 8.29973C23.6565 7.9265 23.7258 7.26336 23.2803 6.81857ZM23.1859 13.8652L20.91 11.5582L9.30905 19.714C8.23452 20.4694 6.69615 20.3566 5.76918 19.431L2.485 16.1512L0.446459 17.6064C-0.0822829 17.9838 -0.15125 18.6545 0.292417 19.1043L6.71906 25.6201C7.16273 26.07 7.95102 26.1286 8.47976 25.7512L23.0318 15.3631C23.5606 14.9856 23.6295 14.315 23.1859 13.8652Z"
        fill={OG_COLORS.textPrimary}
      />
    </svg>
  );
}

function OgHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <PachkaIcon />
      <div
        style={{
          width: '2px',
          height: '56px',
          backgroundColor: OG_COLORS.backgroundBorder,
        }}
      />
      <span
        style={{
          fontSize: '48px',
          fontWeight: 500,
          color: OG_COLORS.textPrimary,
        }}
      >
        Для разработчиков
      </span>
    </div>
  );
}

function OgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: OG_COLORS.background,
        fontFamily: 'TT Commons',
      }}
    >
      <OgHeader />

      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export async function createOgImageResponse(content: React.ReactElement) {
  const fonts = await loadFonts();

  return new ImageResponse(<OgLayout>{content}</OgLayout>, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'TT Commons', data: fonts.medium, weight: 500 as const, style: 'normal' as const },
      { name: 'TT Commons', data: fonts.semibold, weight: 600 as const, style: 'normal' as const },
    ],
  });
}
