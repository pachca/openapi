import Link from 'next/link';

const ENDPOINT_METHOD_COLORS: Record<string, string> = {
  GET: 'bg-method-get/10 text-method-get',
  POST: 'bg-method-post/10 text-method-post',
  PUT: 'bg-method-put/10 text-method-put',
  DELETE: 'bg-method-delete/10 text-method-delete',
  PATCH: 'bg-method-patch/10 text-method-patch',
};

interface EndpointLinkProps {
  method?: string;
  href?: string;
  children: React.ReactNode;
}

export function EndpointLink({ method, href, children }: EndpointLinkProps) {
  const badge = method ? (
    <span
      className={`endpoint-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider -translate-y-px no-underline ${ENDPOINT_METHOD_COLORS[method] || ''}`}
    >
      {method}
    </span>
  ) : null;

  if (href) {
    return (
      <Link
        href={href}
        className="endpoint-link group inline-flex items-baseline gap-1.5 !no-underline hover:!no-underline"
      >
        {badge}
        <span className="font-semibold underline underline-offset-[3px] decoration-1 decoration-current/30 group-hover:decoration-current group-hover:decoration-[1.5px] transition-all">
          {children}
        </span>
      </Link>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-1.5">
      {badge}
      <span>{children}</span>
    </span>
  );
}
