export async function GET(): Promise<Response> {
  const securityTxt = `Contact: mailto:team@pachca.com
Contact: https://pachca.com/security/bug-bounty
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: ru, en
Canonical: https://dev.pachca.com/.well-known/security.txt
`;

  return new Response(securityTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
