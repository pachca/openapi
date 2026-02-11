interface MethodBadgeProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

const METHOD_COLORS = {
  GET: 'bg-method-get/10 text-method-get',
  POST: 'bg-method-post/10 text-method-post',
  PUT: 'bg-method-put/10 text-method-put',
  DELETE: 'bg-method-delete/10 text-method-delete',
  PATCH: 'bg-method-patch/10 text-method-patch',
};

export function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${METHOD_COLORS[method]}`}
    >
      {method}
    </span>
  );
}
