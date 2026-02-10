import { createOgImageResponse, OG_COLORS, METHOD_COLORS } from '@/lib/og/shared';
import { getEndpointByUrl } from '@/lib/openapi/parser';
import { generateTitle } from '@/lib/openapi/mapper';
import { getGuideData } from '@/lib/content-loader';
import { type NextRequest } from 'next/server';

// In-memory cache: URL → PNG buffer (max 50 entries)
const MAX_CACHE_SIZE = 50;
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
};
const imageCache = new Map<string, { buffer: ArrayBuffer; contentType: string }>();

async function cacheAndRespond(key: string, response: Response): Promise<Response> {
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/png';

  if (imageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value!;
    imageCache.delete(firstKey);
  }
  imageCache.set(key, { buffer, contentType });

  return new Response(buffer, { headers: { 'Content-Type': contentType, ...CACHE_HEADERS } });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cacheKey = searchParams.toString();

  const cached = imageCache.get(cacheKey);
  if (cached) {
    return new Response(cached.buffer, {
      headers: { 'Content-Type': cached.contentType, ...CACHE_HEADERS },
    });
  }

  const type = searchParams.get('type');

  let response: Response;

  if (type === 'method') {
    response = await generateMethodImage(searchParams.get('path') || '');
  } else if (type === 'guide') {
    response = await generateGuideImage(searchParams.get('slug') || '');
  } else {
    response = await createOgImageResponse(
    <span
      style={{
        fontSize: '82px',
        fontWeight: 600,
        color: OG_COLORS.textPrimary,
        lineHeight: 1.2,
      }}
    >
      Пачка для разработчиков
    </span>,
    );
  }

  return cacheAndRespond(cacheKey, response);
}

async function generateMethodImage(path: string) {
  const endpoint = await getEndpointByUrl(path);

  if (!endpoint) {
    return createOgImageResponse(
      <span style={{ fontSize: '82px', fontWeight: 700, color: OG_COLORS.textPrimary }}>
        API Reference
      </span>,
    );
  }

  endpoint.title = generateTitle(endpoint);
  const methodColor = METHOD_COLORS[endpoint.method] || OG_COLORS.primary;

  return createOgImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span
          style={{
            fontSize: '30px',
            fontWeight: 600,
            color: methodColor,
            backgroundColor: `${methodColor}1a`,
            padding: '10px 22px',
            borderRadius: '10px',
            letterSpacing: '0.05em',
          }}
        >
          {endpoint.method}
        </span>
        <span
          style={{
            fontSize: '38px',
            fontWeight: 500,
            color: OG_COLORS.textSecondary,
          }}
        >
          {endpoint.path}
        </span>
      </div>

      <span
        style={{
          fontSize: '72px',
          fontWeight: 600,
          color: OG_COLORS.textPrimary,
          lineHeight: 1.2,
        }}
      >
        {endpoint.title}
      </span>
    </div>,
  );
}

async function generateGuideImage(slug: string) {
  const data = getGuideData(slug);
  const title = data?.frontmatter.title || 'Guide';

  return createOgImageResponse(
    <span
      style={{
        fontSize: '82px',
        fontWeight: 600,
        color: OG_COLORS.textPrimary,
        lineHeight: 1.2,
      }}
    >
      {title}
    </span>,
  );
}
