import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { NotesScreen } from "./screens/Notes";
import { NoteScreen } from "./screens/Note";

const root = createRootRoute({
  component: () => (
    <main>
      <nav>
        <Link to="/">Заметки</Link>
        <a href="https://www.pachca.com/">pachca.com</a>
      </nav>
      <Outlet />
    </main>
  ),
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
