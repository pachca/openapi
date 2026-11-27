// Разбор manifest.browser: тот же, что у платформы (общие случаи в contract/browser-hosts.json). check отказывает, Vite-плагин
// не пускает такие хосты в CSP dev-сервера.

const HOST_RE = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?$/;
const HINT = "точный хост или маска поддомена *.example.com, можно с портом, без схемы и пути";

/** Почему запись `browser` не подходит, или `null`. */
export function browserHostError(h: string): string | null {
  const [name = "", port] = h.split(":", 2);
  if (h === "") return "пустой хост";
  if (h.includes("://") || h.endsWith(":")) return "без схемы: только хост";
  if (/[/?#]/.test(h)) return "без пути: только хост";
  if (h === "*" || h.startsWith("*:")) return "голая * открыла бы любой хост";
  if ((h.match(/\*/g)?.length ?? 0) > 1 || (h.includes("*") && !h.startsWith("*."))) return "маска только в начале: *.example.com";
  if (!HOST_RE.test(h) || h.length > 253) return HINT;
  if (port !== undefined && (Number(port) < 1 || Number(port) > 65535)) return "порт от 1 до 65535";
  if (name.startsWith("*.")) {
    const rest = name.slice(2);
    if (!rest.includes(".")) return "маска на домене первого уровня открыла бы слишком много: укажите *.example.com";
    if (/^[0-9.]+$/.test(rest)) return "маска по IP-адресам не поддерживается";
  }
  return null;
}

/** Ошибки списка `browser` в виде строк для вывода, пусто если всё верно. Хосты сравниваются в нижнем регистре, как у платформы. */
export function browserHostProblems(list: readonly string[] | undefined): string[] {
  const out: string[] = [];
  if ((list?.length ?? 0) > 20) out.push("манифест: browser: больше 20 хостов");
  for (const raw of list ?? []) {
    const why = browserHostError(raw.trim().toLowerCase());
    if (why) out.push(`манифест: browser: "${raw}": ${why}`);
  }
  return out;
}
