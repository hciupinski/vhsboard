import { queryOptions } from "@tanstack/react-query";
import { getAdminPortalTheme, getPublicPortalTheme } from "./repository";

export const publicPortalThemeKey = ["public", "portal-theme"] as const;
export const adminPortalThemeKey = ["admin", "portal-theme"] as const;

export const publicPortalThemeOptions = () =>
  queryOptions({
    queryKey: publicPortalThemeKey,
    queryFn: getPublicPortalTheme,
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

export const adminPortalThemeOptions = () =>
  queryOptions({
    queryKey: adminPortalThemeKey,
    queryFn: getAdminPortalTheme,
    staleTime: 0,
    retry: false,
  });
