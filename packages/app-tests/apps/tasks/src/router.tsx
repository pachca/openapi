import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { TasksScreen } from "./screens/Tasks";
import { JobsScreen } from "./screens/Jobs";

const root = createRootRoute({
  component: () => (
    <main>
      <nav>
        <Link to="/">Задачи</Link>
        <Link to="/jobs">Задания</Link>
      </nav>
      <Outlet />
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <p className="err">
      {error instanceof Error ? error.message : String(error)} <button onClick={reset}>Повторить</button>
    </p>
  ),
});

const tasks = createRoute({ getParentRoute: () => root, path: "/", component: TasksScreen });
const jobs = createRoute({ getParentRoute: () => root, path: "/jobs", component: JobsScreen });

export const router = createRouter({ routeTree: root.addChildren([tasks, jobs]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
