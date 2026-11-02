import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecoveryPage } from "@/components/admin/PasswordRecoveryPage";
export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "Odzyskiwanie hasła — VHSBOARD" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PasswordRecoveryPage,
});
