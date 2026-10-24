import type { ConcessionProduct } from "@/lib/domain/cart";
import type {
  Auditorium,
  Cinema,
  Movie,
  PanoramaAsset,
  Screening,
  ScreeningAvailability,
  ScreeningPricing,
} from "@/lib/domain/types";

/**
 * Data-access contract for SeatVision.
 *
 * The UI depends only on this interface. Today it is implemented by
 * `DemoRepository`; a future implementation can call an authorised cinema
 * API (e.g. a Go + PostgreSQL backend) without changing UI code.
 */
export interface SeatVisionRepository {
  readonly mode: "demo" | "live";
  listMovies(): Promise<Movie[]>;
  getMovieBySlug(slug: string): Promise<Movie | null>;
  getMovie(id: string): Promise<Movie | null>;
  listCinemas(): Promise<Cinema[]>;
  getCinema(id: string): Promise<Cinema | null>;
  listAuditoriums(): Promise<Auditorium[]>;
  getAuditorium(id: string): Promise<Auditorium | null>;
  listScreenings(filter?: { movieId?: string; cinemaId?: string }): Promise<Screening[]>;
  getScreening(id: string): Promise<Screening | null>;
  /** `null` when the provider supplies no availability for the screening. */
  getAvailability(screeningId: string): Promise<ScreeningAvailability | null>;
  /** `null` when the provider supplies no pricing for the screening. */
  getPricing(screeningId: string): Promise<ScreeningPricing | null>;
  listPanoramas(auditoriumId: string): Promise<PanoramaAsset[]>;
  listConcessions(cinemaId: string): Promise<ConcessionProduct[]>;
}

/** Everything a screening page needs, loaded in one call. */
export interface ScreeningBundle {
  screening: Screening;
  movie: Movie;
  cinema: Cinema;
  auditorium: Auditorium;
  availability: ScreeningAvailability | null;
  pricing: ScreeningPricing | null;
  panoramas: PanoramaAsset[];
}

export async function loadScreeningBundle(
  repo: SeatVisionRepository,
  screeningId: string,
): Promise<ScreeningBundle | null> {
  const screening = await repo.getScreening(screeningId);
  if (!screening) return null;
  const [movie, cinema, auditorium, availability, pricing, panoramas] = await Promise.all([
    repo.getMovie(screening.movieId),
    repo.getCinema(screening.cinemaId),
    repo.getAuditorium(screening.auditoriumId),
    repo.getAvailability(screening.id),
    repo.getPricing(screening.id),
    repo.listPanoramas(screening.auditoriumId),
  ]);
  if (!movie || !cinema || !auditorium) return null;
  return { screening, movie, cinema, auditorium, availability, pricing, panoramas };
}
