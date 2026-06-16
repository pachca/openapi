/**
 * Client libraries and tools for the API overview panel.
 *
 * One entry per official client: the CLI and the six generated SDKs. Used by
 * <ApiClientPanel> (rendered on /api/overview) and by the mdx-expander so the
 * same list appears in generated .md / llms-full.txt.
 *
 * Install commands and package names mirror the dedicated docs pages
 * (guides/cli, guides/sdk/*) — keep them in sync.
 */

export interface ApiClient {
  /** Stable id, also the tab key */
  id: string;
  /** Full label (used in generated markdown) */
  label: string;
  /** Optional shorter label for the tab bar (falls back to label) */
  short?: string;
  /** Shiki language for the install snippet */
  lang: string;
  /** Install command or package identifier */
  install: string;
  /** One-line teaser of what the client's docs cover (panel docs link) */
  blurb: string;
  /** Docs page for this client */
  href: string;
}

export const API_CLIENTS: ApiClient[] = [
  {
    id: 'cli',
    label: 'CLI',
    lang: 'bash',
    install: 'npm install -g @pachca/cli',
    blurb: 'Установка, автодополнение и все команды для работы из терминала и агентов',
    href: '/guides/cli/overview',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    short: 'TS',
    lang: 'bash',
    install: 'npm install @pachca/sdk',
    blurb: 'Установка, создание клиента и типизированные запросы с автодополнением',
    href: '/guides/sdk/typescript',
  },
  {
    id: 'python',
    label: 'Python',
    lang: 'bash',
    install: 'pip install pachca-sdk',
    blurb: 'Установка, авторизация и асинхронные запросы с моделями-датаклассами',
    href: '/guides/sdk/python',
  },
  {
    id: 'go',
    label: 'Go',
    lang: 'bash',
    install: 'go get github.com/pachca/openapi/sdk/go/generated',
    blurb: 'Установка, синхронный клиент с context и обходом всех страниц',
    href: '/guides/sdk/go',
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    lang: 'kotlin',
    install:
      '// build.gradle.kts\ndependencies {\n    implementation("com.pachca:pachca-sdk:latest.release")\n}',
    blurb: 'Установка через Gradle, клиент на корутинах и сериализация моделей',
    href: '/guides/sdk/kotlin',
  },
  {
    id: 'swift',
    label: 'Swift',
    lang: 'swift',
    install:
      '// Package.swift\ndependencies: [\n    .package(url: "https://github.com/pachca/openapi", from: "1.0.0")\n]',
    blurb: 'Установка через SPM, клиент на async/await и модели Codable',
    href: '/guides/sdk/swift',
  },
  {
    id: 'csharp',
    label: 'C#',
    lang: 'bash',
    install: 'dotnet add package Pachca.Sdk',
    blurb: 'Установка, асинхронный клиент на HttpClient с поддержкой отмены',
    href: '/guides/sdk/csharp',
  },
];
