import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { getRepository } from "@/lib/data";
import { formatDay, formatTime, formatDuration, FORMAT_SHORT } from "@/lib/format";
import { formatMoneyOrUnknown, seatPrice } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge } from "@/components/ui/data-badge";

export function generateStaticParams() {
  const repo = getRepository();
  return repo.listMovies().then((movies) => movies.map((m) => ({ slug: m.slug })));
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getRepository();

  const movie = await repo.getMovieBySlug(slug);
  if (!movie) {
    notFound();
  }

  const [screenings, cinemas, auditoriums] = await Promise.all([
    repo.listScreenings({ movieId: movie.id }),
    repo.listCinemas(),
    repo.listAuditoriums(),
  ]);

  return (
    <div className="container-page py-8 space-y-8">
      {/* Hero Movie Details Banner */}
      <div className="card bg-ink-900 border-ink-800 overflow-hidden shadow-2xl relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
          {/* Poster art */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-black shadow-lg border border-ink-750">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover brightness-95"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ivory-500 font-mono text-xs">
                  No Poster Artwork
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="eyebrow">{movie.genres.join(" · ")}</span>
              <DataBadge source={movie.provenance.source} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-ivory-50">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-ivory-400 font-mono flex-wrap">
              <span>{formatDuration(movie.durationMinutes)}</span>
              <span>·</span>
              <span>Rating: {movie.ageRating || "Not rated"}</span>
              <span>·</span>
              <span>Year: {movie.releaseYear || "2026"}</span>
            </div>

            <p className="text-sm text-ivory-300 leading-relaxed max-w-2xl">
              {movie.synopsis}
            </p>

            {movie.moods.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-ivory-400 font-medium">Atmosphere:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {movie.moods.map((m) => (
                    <Badge key={m} variant="secondary" className="capitalize text-[11px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenings Schedule List */}
      <div className="space-y-4">
        <div>
          <span className="eyebrow">Auditorium Schedule</span>
          <h2 className="text-2xl font-bold text-ivory-100 flex items-center gap-2">
            Available Showtimes & Halls ({screenings.length})
          </h2>
          <p className="text-xs text-ivory-400 mt-0.5">
            Select a screening to launch the interactive seating map, view preview, and SeatMatch assistant.
          </p>
        </div>

        {screenings.length === 0 ? (
          <div className="card bg-ink-900 border-ink-800 p-8 text-center text-ivory-400 text-xs">
            No showtimes are currently scheduled for this movie.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenings.map((s) => {
              const cinema = cinemas.find((c) => c.id === s.cinemaId);
              const auditorium = auditoriums.find((a) => a.id === s.auditoriumId);

              return (
                <div
                  key={s.id}
                  className="card bg-ink-900 border-ink-800 p-5 flex flex-col justify-between gap-4 hover:border-gold-500/40 transition-all shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="gold">{FORMAT_SHORT[s.format]}</Badge>
                          <span className="text-[11px] text-ivory-400 font-mono">
                            {s.language}
                          </span>
                        </div>
                        <h3 className="font-bold text-ivory-50 text-base">{cinema?.name}</h3>
                        <p className="text-xs text-ivory-400">{auditorium?.name}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-ivory-400 font-mono block">
                          {formatDay(s.startsAt)}
                        </span>
                        <span className="text-xl font-extrabold text-gold-300 font-mono">
                          {formatTime(s.startsAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/screenings/${s.id}`}>
                    <Button variant="gold" size="sm" className="w-full justify-between">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Explore Seating & Views
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
