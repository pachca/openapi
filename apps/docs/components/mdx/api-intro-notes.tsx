import Link from 'next/link';

/**
 * Extra intro paragraphs for the /api/overview left column (passed to
 * <HomeHeroContent lead>): getting-started and no-code pointers as plain
 * prose, no headings.
 */
export function ApiIntroNotes() {
  return (
    <p>
      Если только начинаете, загляните в{' '}
      <Link href="/" className="text-primary hover:underline">
        руководства
      </Link>{' '}
      с пошаговыми примерами. Чтобы автоматизировать Пачку без кода, используйте{' '}
      <Link href="/guides/n8n/overview" className="text-primary hover:underline">
        n8n
      </Link>{' '}
      и визуальные сценарии.
    </p>
  );
}
