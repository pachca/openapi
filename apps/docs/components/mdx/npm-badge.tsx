import { PackageBadge } from './package-badge';

interface NpmBadgeProps {
  package: string;
  version?: string;
  date?: string;
}

export function NpmBadge({ package: pkg, version, date }: NpmBadgeProps) {
  const displayVersion = version && date ? `${version} · ${date}` : version;
  return (
    <PackageBadge
      name={pkg}
      href={`https://www.npmjs.com/package/${pkg}`}
      version={displayVersion}
    />
  );
}
