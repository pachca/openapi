// Built once at `next build`, so Expires counts from the deploy: RFC 9116
// §2.5.5 asks for less than a year ahead, and a site left without deploys
// for half a year honestly reports its contacts as stale.
export const dynamic = 'force-static';

const EXPIRES_IN_DAYS = 180;

export async function GET(): Promise<Response> {
  const expires = new Date();
  expires.setUTCHours(0, 0, 0, 0);
  expires.setUTCDate(expires.getUTCDate() + EXPIRES_IN_DAYS);

  const securityTxt = `Contact: mailto:team@pachca.com
Contact: https://pachca.com/security/bug-bounty
Expires: ${expires.toISOString()}
Preferred-Languages: ru, en
Canonical: https://dev.pachca.com/.well-known/security.txt
`;

  return new Response(securityTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
