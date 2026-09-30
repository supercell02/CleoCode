import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createMemoryRouter, RouterProvider, useRouteError } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Home } from "./screens/home";
import { NewSession } from "./screens/new-session";
import { Session } from "./screens/session";

function AppErrorBoundary() {
  const error = useRouteError();
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unexpected application error";

  return (
    <box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <text fg="red">Application error</text>
      <text>{message}</text>
    </box>
  );
}

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <AppErrorBoundary />,
    children: [
      {index: true, element: <Home />},
      {path: "sessions/new", element: <NewSession />},
      {path: "sessions/:id", element: <Session />}
    ]
  }
]);


function App() {
  return <RouterProvider router={router} />
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
