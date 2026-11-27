import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { NotesScreen } from "./screens/Notes";
import { NoteScreen } from "./screens/Note";

// Экраны меняет только роутер (history.pushState в том же документе). Переход на свой адрес мимо роутера
// (<a href="/x"> без Link, location.href) Пачка отменит: документ в iframe один.
const root = createRootRoute({
  component: () => (
    <main>
      <nav>
        <Link to="/">Заметки</Link>
        {/* Ссылки наружу только тегом <a href="https://…"> и только по клику человека. Адрес Пачки
            (https://app.pachca.com/chats/<id>) откроется переходом в Пачке, остальные после окна с адресом. */}
        <a href="https://www.pachca.com/">pachca.com</a>
      </nav>
      <Outlet />
    </main>
  ),
  // Ошибка живого запроса (useQuery) бросается при рендере и попадает сюда
  errorComponent: ({ error, reset }) => (
    <p className="err">
      {error instanceof Error ? error.message : String(error)} <button onClick={reset}>Повторить</button>
    </p>
  ),
  notFoundComponent: () => <p>Такой страницы нет. <Link to="/">К заметкам</Link></p>,
});

const notes = createRoute({ getParentRoute: () => root, path: "/", component: NotesScreen });
const note = createRoute({ getParentRoute: () => root, path: "/notes/$id", component: NoteScreen });

export const router = createRouter({ routeTree: root.addChildren([notes, note]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
