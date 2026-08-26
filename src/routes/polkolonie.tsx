import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/polkolonie")({
  component: PolkolonieLayout,
});

function PolkolonieLayout() {
  return <Outlet />;
}
