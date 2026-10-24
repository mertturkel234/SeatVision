import type { SeatVisionRepository } from "../repository";
import { auditoriums, availability, cinemas, concessions, movies, pricing, screenings } from "./dataset";

/** In-memory repository over the deterministic demo dataset. */
export class DemoRepository implements SeatVisionRepository {
  readonly mode = "demo" as const;

  async listMovies() {
    return movies;
  }
  async getMovieBySlug(slug: string) {
    return movies.find((m) => m.slug === slug) ?? null;
  }
  async getMovie(id: string) {
    return movies.find((m) => m.id === id) ?? null;
  }
  async listCinemas() {
    return cinemas;
  }
  async getCinema(id: string) {
    return cinemas.find((c) => c.id === id) ?? null;
  }
  async listAuditoriums() {
    return auditoriums;
  }
  async getAuditorium(id: string) {
    return auditoriums.find((a) => a.id === id) ?? null;
  }
  async listScreenings(filter?: { movieId?: string; cinemaId?: string }) {
    return screenings
      .filter((s) => (!filter?.movieId || s.movieId === filter.movieId) && (!filter?.cinemaId || s.cinemaId === filter.cinemaId))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  async getScreening(id: string) {
    return screenings.find((s) => s.id === id) ?? null;
  }
  async getAvailability(screeningId: string) {
    return availability.find((a) => a.screeningId === screeningId) ?? null;
  }
  async getPricing(screeningId: string) {
    return pricing.find((p) => p.screeningId === screeningId) ?? null;
  }
  async listPanoramas() {
    // No seat-specific photography exists in the demo dataset. The UI renders
    // a clearly labelled illustrative simulation instead.
    return [];
  }
  async listConcessions() {
    return concessions;
  }
}
