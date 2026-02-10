import { createOgImageResponse, OG_COLORS, METHOD_COLORS } from '@/lib/og/shared';
import { getEndpointByUrl } from '@/lib/openapi/parser';
import { generateTitle } from '@/lib/openapi/mapper';
import { getGuideData } from '@/lib/content-loader';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  if (type === 'method') {
    return generateMethodImage(searchParams.get('path') || '');
  }

  if (type === 'guide') {
    return generateGuideImage(searchParams.get('slug') || '');
  }

  // Default: home page style
  return createOgImageResponse(
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
