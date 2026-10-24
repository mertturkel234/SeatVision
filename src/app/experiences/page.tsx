import React from "react";
import Link from "next/link";
import { SlidersHorizontal, Film, Clock, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { getRepository } from "@/lib/data";
import { buildExperienceRows, FORMAT_LABELS } from "@/lib/domain/experiences";
import { formatDay, formatTime } from "@/lib/format";
import { formatMoneyOrUnknown } from "@/lib/domain/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataBadge } from "@/components/ui/data-badge";

export default async function ExperiencesPage() {
  const repo = getRepository();

  const [screenings, movies, cinemas, auditoriums] = await Promise.all([
    repo.listScreenings(),
    repo.listMovies(),
    repo.listCinemas(),
    repo.listAuditoriums(),
  ]);

  const pricing = (
    await Promise.all(screenings.map((s) => repo.getPricing(s.id)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  const availability = (
    await Promise.all(screenings.map((s) => repo.getAvailability(s.id)))
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  const rows = buildExperienceRows({
    screenings,
    cinemas,
    auditoriums,
    availability,
    pricing,
  });

  return (
    <div className="container-page py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-ink-800 pb-5">
        <span className="eyebrow">Cinema Format Comparison</span>
        <h1 className="text-3xl font-bold text-ivory-50 flex items-center gap-3">
          Compare Cinema Experiences
          <SlidersHorizontal className="w-6 h-6 text-gold-400" />
        </h1>
        <p className="text-sm text-ivory-400 mt-1 max-w-3xl">
          Side-by-side structured comparison of available projection formats, ticket price brackets, hall amenities, and verified seat inventories.
        </p>
      </div>

      {/* Structured Comparison Table Card */}
      <div className="card bg-ink-900 border-ink-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ivory-300">
            <thead className="bg-ink-850 text-ivory-400 uppercase font-mono text-[11px] border-b border-ink-800">
              <tr>
                <th className="px-5 py-4">Movie & Showtime</th>
                <th className="px-5 py-4">Format / Hall</th>
                <th className="px-5 py-4">Price Range</th>
                <th className="px-5 py-4">Availability</th>
                <th className="px-5 py-4">Verified Amenities</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/80">
              {rows.map((row) => {
                const movie = movies.find((m) => m.id === row.screening.movieId);

                return (
                  <tr
                    key={row.screening.id}
                    className="hover:bg-ink-800/40 transition-colors"
                  >
                    {/* Movie & Showtime */}
                    <td className="px-5 py-4 font-medium">
                      <div className="font-bold text-ivory-50 text-sm">
                        {movie?.title || "Movie"}
                      </div>
                      <div className="text-ivory-400 font-mono text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{formatDay(row.screening.startsAt)}</span>
                        <span>·</span>
                        <span className="text-gold-300 font-bold">
                          {formatTime(row.screening.startsAt)}
                        </span>
                      </div>
                    </td>

                    {/* Format / Hall */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={
                            row.format === "large-format" || row.format === "premium"
                              ? "gold"
                              : "secondary"
                          }
                        >
                          {FORMAT_LABELS[row.format]}
                        </Badge>
                      </div>
                      <div className="text-ivory-400 text-[11px]">
                        {row.cinema.name} · {row.auditorium.name}
                      </div>
                    </td>

                    {/* Price Range */}
                    <td className="px-5 py-4 font-mono">
                      {row.priceRange ? (
                        <span className="font-bold text-ivory-100">
                          {formatMoneyOrUnknown(row.priceRange.min)}
                          {row.priceRange.min.amountMinor !==
                            row.priceRange.max.amountMinor && (
                            <> - {formatMoneyOrUnknown(row.priceRange.max)}</>
                          )}
                        </span>
                      ) : (
                        <span className="text-ivory-500">Price unavailable</span>
                      )}
                    </td>

                    {/* Availability */}
                    <td className="px-5 py-4">
                      {row.availableSeats !== null ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-ivory-100 font-medium">
                            {row.availableSeats} of {row.totalSeats} seats open
                          </span>
                          <div className="w-24 h-1.5 rounded-full bg-ink-800 overflow-hidden">
                            <div
                              className="h-full bg-gold-400 rounded-full"
                              style={{
                                width: `${(row.availableSeats / (row.totalSeats || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-ivory-500 font-mono">Unknown</span>
                      )}
                    </td>

                    {/* Amenities */}
                    <td className="px-5 py-4">
                      {row.amenities ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {row.amenities.value.map((amenity, i) => (
                            <span
                              key={i}
                              className="bg-ink-800 px-2 py-0.5 rounded text-[10px] text-ivory-300 border border-ink-700"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ivory-500 text-[11px]">None listed</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <Link href={`/screenings/${row.screening.id}`}>
                        <Button variant="gold" size="sm">
                          Select Seats
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
