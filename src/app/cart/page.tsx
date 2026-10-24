import { getRepository } from "@/lib/data";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const repo = getRepository();

  const [screenings, movies, cinemas, auditoriums] = await Promise.all([
    repo.listScreenings(),
    repo.listMovies(),
    repo.listCinemas(),
    repo.listAuditoriums(),
  ]);

  const pricings = (
    await Promise.all(screenings.map((s) => repo.getPricing(s.id)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  const availabilities = (
    await Promise.all(screenings.map((s) => repo.getAvailability(s.id)))
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  return (
    <CartClient
      screenings={screenings}
      movies={movies}
      cinemas={cinemas}
      auditoriums={auditoriums}
      pricings={pricings}
      availabilities={availabilities}
    />
  );
}
