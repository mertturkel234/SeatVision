"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  SlidersHorizontal,
  Film,
  Clock,
  ArrowRight,
  Filter,
  RotateCcw,
} from "lucide-react";
import type { Movie, Screening, Genre, Mood, ExperienceFormat } from "@/lib/domain/types";
import { GENRES, MOODS, EXPERIENCE_FORMATS } from "@/lib/domain/types";
import { rankMovies, type DiscoveryPreferences } from "@/lib/domain/discovery";
import { formatDuration, FORMAT_SHORT } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export interface DiscoverClientProps {
  movies: Movie[];
  screenings: Screening[];
}

export function DiscoverClient({ movies, screenings }: DiscoverClientProps) {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(["sci-fi", "thriller"]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>("spectacle");
  const [selectedFormat, setSelectedFormat] = useState<ExperienceFormat | null>("large-format");

  const preferences: DiscoveryPreferences = useMemo(
    () => ({
      genres: selectedGenres,
      mood: selectedMood,
      experience: selectedFormat,
    }),
    [selectedGenres, selectedMood, selectedFormat]
  );

  const ranked = useMemo(() => {
    return rankMovies(movies, screenings, preferences);
  }, [movies, screenings, preferences]);

  const toggleGenre = (genre: Genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedMood(null);
    setSelectedFormat(null);
  };

  return (
    <div className="container-page py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-ink-800 pb-5">
        <span className="eyebrow">Personalized Discovery</span>
        <h1 className="text-3xl font-bold text-ivory-50 flex items-center gap-2.5">
          Find Your Next Cinema Experience
          <Sparkles className="w-6 h-6 text-gold-400" />
        </h1>
        <p className="text-sm text-ivory-400 mt-1 max-w-2xl">
          Transparent, rule-based cinema matching. Filter by your preferred genres, desired mood, or auditorium format to get ranked movie suggestions with clear reasons.
        </p>
      </div>

      {/* Filter Matrix Card */}
      <div className="card bg-ink-900 border-ink-800 p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <span className="text-xs font-semibold text-ivory-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gold-400" />
            Your Viewing Preferences
          </span>
          {(selectedGenres.length > 0 || selectedMood || selectedFormat) && (
            <button
              onClick={handleReset}
              className="text-xs text-ivory-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        {/* 1. Genres */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-ivory-300 block">
            Select Favorite Genres (+3 pts each)
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
                    active
                      ? "bg-gold-500 text-ink-950 border-gold-400 font-bold"
                      : "bg-ink-850 text-ivory-300 border-ink-750 hover:bg-ink-800 hover:text-ivory-100"
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-ink-800">
          {/* 2. Mood */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ivory-300 block">
              Desired Atmosphere / Mood (+2 pts)
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const active = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(active ? null : mood)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
                      active
                        ? "bg-gold-500 text-ink-950 border-gold-400 font-bold"
                        : "bg-ink-850 text-ivory-300 border-ink-750 hover:bg-ink-800 hover:text-ivory-100"
                    )}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ivory-300 block">
              Preferred Format Experience (+1 pt)
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_FORMATS.map((fmt) => {
                const active = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(active ? null : fmt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      active
                        ? "bg-gold-500 text-ink-950 border-gold-400 font-bold"
                        : "bg-ink-850 text-ivory-300 border-ink-750 hover:bg-ink-800 hover:text-ivory-100"
                    )}
                  >
                    {FORMAT_SHORT[fmt]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ivory-100">
            Recommended Movies ({ranked.length})
          </h2>
          <span className="text-xs text-ivory-400 font-mono">
            Deterministic rule-based ranking · Zero blackbox algorithms
          </span>
        </div>

        {ranked.length === 0 ? (
          <div className="card bg-ink-900 border-ink-800 p-12 text-center space-y-3">
            <p className="text-ivory-300 font-semibold">No movies match all selected criteria.</p>
            <p className="text-xs text-ivory-500">
              Try broadening your genre or atmosphere selection to see more titles.
            </p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ranked.map(({ movie, score, reasons, matchedGenres }) => {
              const movieScreenings = screenings.filter((s) => s.movieId === movie.id);
              const formats = Array.from(new Set(movieScreenings.map((s) => s.format)));

              return (
                <div
                  key={movie.id}
                  className="card bg-ink-900 border-ink-800 overflow-hidden flex flex-col justify-between group hover:border-gold-500/40 transition-all shadow-xl"
                >
                  <div>
                    {/* Key art header */}
                    <div className="relative w-full h-64 bg-black overflow-hidden">
                      {movie.posterUrl ? (
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 360px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ivory-500 bg-ink-850 font-mono text-xs">
                          No Poster Asset
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />

                      {/* Score Badge */}
                      {score > 0 && (
                        <div className="absolute top-3 right-3 bg-gold-500 text-ink-950 font-bold px-2.5 py-1 rounded-md text-xs font-mono shadow-md flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{score} pts</span>
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {formats.map((fmt) => (
                            <Badge key={fmt} variant="gold" className="text-[10px]">
                              {FORMAT_SHORT[fmt]}
                            </Badge>
                          ))}
                          <span className="text-xs text-ivory-500 font-mono">
                            {formatDuration(movie.durationMinutes)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-ivory-50 group-hover:text-gold-300 transition-colors">
                          {movie.title}
                        </h3>
                      </div>

                      <p className="text-xs text-ivory-400 leading-relaxed line-clamp-2">
                        {movie.synopsis}
                      </p>

                      {/* Explanation Reasons list */}
                      {reasons.length > 0 && (
                        <div className="bg-ink-850 p-3 rounded-lg border border-ink-800 text-[11px] space-y-1">
                          <span className="text-gold-400 font-semibold font-mono uppercase text-[10px] block">
                            Why this matches:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-ivory-300">
                            {reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link href={`/movies/${movie.slug}`}>
                      <Button variant="gold" size="sm" className="w-full justify-between">
                        <span>View Showtimes & Seats</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
