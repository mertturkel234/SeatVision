import type { ExperienceFormat, Genre, Mood, Movie, Screening } from "./types";

/**
 * Personalised discovery — transparent, rule-based ranking.
 * No behavioural tracking, no machine learning. Points per rule:
 *   +3 per selected genre the movie has
 *   +2 if the movie carries the selected mood tag
 *   +1 if a screening in the selected experience format exists
 */

export interface DiscoveryPreferences {
  genres: Genre[];
  mood: Mood | null;
  experience: ExperienceFormat | null;
}

export const DISCOVERY_POINTS = { genre: 3, mood: 2, experience: 1 } as const;

export interface RankedMovie {
  movie: Movie;
  score: number;
  reasons: string[];
  matchedGenres: Genre[];
}

export function hasDiscoveryPreferences(p: DiscoveryPreferences): boolean {
  return p.genres.length > 0 || p.mood !== null || p.experience !== null;
}

export function rankMovies(movies: Movie[], screenings: Screening[], prefs: DiscoveryPreferences): RankedMovie[] {
  const active = hasDiscoveryPreferences(prefs);
  const ranked = movies.map((movie): RankedMovie => {
    const reasons: string[] = [];
    const matchedGenres = movie.genres.filter((g) => prefs.genres.includes(g));
    let score = matchedGenres.length * DISCOVERY_POINTS.genre;
    if (matchedGenres.length > 0) reasons.push(`Matches your genre${matchedGenres.length > 1 ? "s" : ""}: ${matchedGenres.join(", ")}.`);
    if (prefs.mood && movie.moods.includes(prefs.mood)) {
      score += DISCOVERY_POINTS.mood;
      reasons.push(`Tagged “${prefs.mood}” by our editorial (demo) tags.`);
    }
    if (prefs.experience) {
      const has = screenings.some((s) => s.movieId === movie.id && s.format === prefs.experience);
      if (has) {
        score += DISCOVERY_POINTS.experience;
        reasons.push(`Has a ${prefs.experience} screening in the sample schedule.`);
      }
    }
    return { movie, score, reasons, matchedGenres };
  });
  const filtered = active ? ranked.filter((r) => r.score > 0) : ranked;
  return filtered.sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title));
}
