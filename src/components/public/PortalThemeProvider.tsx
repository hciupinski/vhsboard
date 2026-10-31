import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { publicPortalThemeOptions } from "@/lib/portal-theme/query-options";

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublic =
    pathname !== "/admin" && !pathname.startsWith("/admin/") && pathname !== "/admin-shell";
  const { data: theme = "original" } = useQuery({
    ...publicPortalThemeOptions(),
    enabled: isPublic && typeof window !== "undefined",
  });

  useEffect(() => {
    if (isPublic) document.documentElement.dataset["portalTheme"] = theme;
    else delete document.documentElement.dataset["portalTheme"];

    return () => {
      delete document.documentElement.dataset["portalTheme"];
    };
  }, [isPublic, theme]);

  return children;
}
