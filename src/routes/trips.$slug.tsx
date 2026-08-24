import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

const isSafeSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export const Route = createFileRoute("/trips/$slug")({
  beforeLoad: ({ params }) => {
    if (!isSafeSlug(params.slug)) {
      throw notFound();
    }

    throw redirect({ to: "/wyjazdy/$slug", params: { slug: params.slug } });
  },
});
