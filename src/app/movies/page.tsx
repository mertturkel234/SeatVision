import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Film, Calendar, Clock, ArrowRight } from "lucide-react";
import { getRepository } from "@/lib/data";
import { formatDuration, FORMAT_SHORT } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function MoviesPage() {
  const repo = getRepository();
  const [movies, screenings] = await Promise.all([
    repo.listMovies(),
    repo.listScreenings(),
  ]);

  return (
    <div className="container-page py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-ink-800 pb-5">
        <span className="eyebrow">Now Playing & Featured</span>
        <h1 className="text-3xl font-bold text-ivory-50 flex items-center gap-2.5">
          Cinema Catalogue
        </h1>
        <p className="text-sm text-ivory-400 mt-1 max-w-2xl">
          Browse films currently screening with verified spatial auditorium maps and view previews.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => {
          const movieScreenings = screenings.filter((s) => s.movieId === movie.id);
          const formats = Array.from(new Set(movieScreenings.map((s) => s.format)));

          return (
            <div
              key={movie.id}
              className="card bg-ink-900 border-ink-800 overflow-hidden flex flex-col justify-between group hover:border-gold-500/40 transition-all shadow-xl"
            >
              <div>
                {/* Poster */}
                <div className="relative w-full aspect-[2/3] bg-black overflow-hidden">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-95"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-ivory-500 bg-ink-850 font-mono text-xs">
                      <Film className="w-8 h-8 mb-2 opacity-40" />
                      <span>Poster Artwork Not Available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent opacity-80" />
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {formats.map((fmt) => (
                      <Badge key={fmt} variant="gold" className="text-[10px]">
                        {FORMAT_SHORT[fmt]}
                      </Badge>
                    ))}
                    <span className="text-[11px] text-ivory-500 font-mono">
                      {formatDuration(movie.durationMinutes)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-ivory-50 group-hover:text-gold-300 transition-colors line-clamp-1">
                    {movie.title}
                  </h2>

                  <p className="text-xs text-ivory-400 line-clamp-2 leading-relaxed">
                    {movie.synopsis}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link href={`/movies/${movie.slug}`}>
                  <Button variant="secondary" size="sm" className="w-full justify-between">
                    <span>{movieScreenings.length} Showtimes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
