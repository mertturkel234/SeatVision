import { getRepository } from "@/lib/data";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const repo = getRepository();
  const [movies, screenings] = await Promise.all([
    repo.listMovies(),
    repo.listScreenings(),
  ]);

  return <DiscoverClient movies={movies} screenings={screenings} />;
}
