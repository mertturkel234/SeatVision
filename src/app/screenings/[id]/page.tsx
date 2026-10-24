import { notFound } from "next/navigation";
import { getRepository, loadScreeningBundle } from "@/lib/data";
import { ScreeningClient } from "./screening-client";

export function generateStaticParams() {
  const repo = getRepository();
  return repo.listScreenings().then((screenings) => screenings.map((s) => ({ id: s.id })));
}

export default async function ScreeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const bundle = await loadScreeningBundle(repo, id);

  if (!bundle) {
    notFound();
  }

  return <ScreeningClient bundle={bundle} />;
}
