import { supabase } from "../supabase";

export type AdminSession = { userId: string; email: string; role: "admin" };

const applicationOrigin = "https://vhsboard.local";
const adminPathPattern = /^\/admin(?:\/[^/?#]+)?$/;

export const getAdminSession = async (): Promise<AdminSession | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const user = authError ? null : authData.session?.user;

    if (!user?.email) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return null;
    }

    return { userId: user.id, email: user.email, role: "admin" };
  } catch {
    return null;
  }
};

export const signInWithPassword = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export const sanitizeAdminNext = (next: string | undefined): string => {
  if (!next) {
    return "/admin";
  }

  try {
    const decoded = decodeURIComponent(next);
    const destination = new URL(decoded, applicationOrigin);

    if (
      destination.origin !== applicationOrigin ||
      destination.search !== "" ||
      destination.hash !== "" ||
      !adminPathPattern.test(destination.pathname)
    ) {
      return "/admin";
    }

    return destination.pathname;
  } catch {
    return "/admin";
  }
};
