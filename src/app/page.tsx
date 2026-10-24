import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  Sparkles,
  Columns,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building2,
  Film,
  CheckCircle2,
} from "lucide-react";
import { getRepository } from "@/lib/data";
import { formatDuration, FORMAT_SHORT } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const repo = getRepository();

  const [movies, screenings, auditoriums] = await Promise.all([
    repo.listMovies(),
    repo.listScreenings(),
    repo.listAuditoriums(),
  ]);

  const featuredScreening = screenings[0];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-ink-800">
        {/* Background Key Image with Rich Cinematic Lighting */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-auditorium.jpg"
            alt="SeatVision Empty Cinema Auditorium"
            fill
            className="object-cover opacity-35 brightness-75 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
        </div>

        <div className="container-page relative z-10 py-24 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-ink-900/90 border border-gold-500/30 px-3.5 py-1.5 rounded-full text-xs text-gold-300 font-mono shadow-lg backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Introducing SeatMatch™ Spatial Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-ivory-50 tracking-tight leading-[1.1]">
            Never Buy a Blind <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600">
              Cinema Seat Again.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-ivory-300 max-w-2xl mx-auto leading-relaxed">
            SeatVision helps moviegoers preview their exact screen view before purchasing tickets, compare adjacent rows side-by-side, and receive explainable seat recommendations powered by auditorium geometry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {featuredScreening && (
              <Link href={`/screenings/${featuredScreening.id}`}>
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-base">
                  <Eye className="w-5 h-5 mr-2" />
                  Find Your Perfect Seat
                </Button>
              </Link>
            )}
            <Link href="/discover">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Explore Discovery Engine
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-ivory-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              Verified Metric Sightlines
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              Simulated 3D View Previews
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              No Blind Angles
            </span>
          </div>
        </div>
      </section>

      {/* 2. Featured Movies & Screenings */}
      <section className="container-page space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink-800 pb-4">
          <div>
            <span className="eyebrow">Now Screening</span>
            <h2 className="text-3xl font-bold text-ivory-50">Featured Films & Halls</h2>
            <p className="text-xs text-ivory-400 mt-1">
              Select a screening to explore its interactive spatial map and SeatMatch recommendations.
            </p>
          </div>
          <Link
            href="/movies"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1"
          >
            <span>View Full Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.slice(0, 4).map((movie) => {
            const movieScreenings = screenings.filter((s) => s.movieId === movie.id);
            const formats = Array.from(new Set(movieScreenings.map((s) => s.format)));

            return (
              <div
                key={movie.id}
                className="card bg-ink-900 border-ink-800 overflow-hidden flex flex-col justify-between group hover:border-gold-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="relative w-full aspect-[2/3] bg-black overflow-hidden">
                    {movie.posterUrl && (
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-95"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent opacity-80" />
                  </div>

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

                    <h3 className="text-lg font-bold text-ivory-50 group-hover:text-gold-300 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>

                    <p className="text-xs text-ivory-400 line-clamp-2 leading-relaxed">
                      {movie.synopsis}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link href={`/movies/${movie.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full justify-between">
                      <span>{movieScreenings.length} Screenings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. The 3 Core Pillars of SeatVision */}
      <section className="container-page space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="eyebrow">Technology Foundation</span>
          <h2 className="text-3xl font-bold text-ivory-50">
            Spatial Intelligence For Modern Cinemas
          </h2>
          <p className="text-xs sm:text-sm text-ivory-400">
            Traditional ticketing platforms present abstract seat grids. SeatVision calculates true physical coordinates, screen angles, and sightline impediments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-ink-900 border-ink-800 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ivory-50">View From Seat Preview</h3>
            <p className="text-xs text-ivory-400 leading-relaxed">
              Drag-to-pan simulation of screen scale, lateral offset, and viewing angle. Know beforehand if a seat is too close, too steep, or obstructed by railings.
            </p>
          </div>

          <div className="card bg-ink-900 border-ink-800 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ivory-50">Explainable SeatMatch™</h3>
            <p className="text-xs text-ivory-400 leading-relaxed">
              Configurable scoring rules (angle, distance, preferred zone, verified premium category) that explain *why* seats were chosen rather than showing an arbitrary score.
            </p>
          </div>

          <div className="card bg-ink-900 border-ink-800 p-6 space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ivory-50">Side-by-Side Comparison</h3>
            <p className="text-xs text-ivory-400 leading-relaxed">
              Compare any two seats in real-time on mobile or desktop. Inspect prices, distance ratios, and line-of-sight angles before committing.
            </p>
          </div>
        </div>
      </section>

      {/* 4. B2B Cinema Operators Value Proposition */}
      <section className="container-page">
        <div className="card bg-gradient-to-br from-ink-900 to-ink-850 border-ink-750 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-gold-400 uppercase tracking-widest">
                <Building2 className="w-4 h-4" />
                <span>For Cinema Operators & Chains</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-ivory-50">
                Unlock Premium Seat Revenue & Reduce Front-Row Dropout
              </h2>

              <p className="text-xs sm:text-sm text-ivory-300 leading-relaxed max-w-2xl">
                Cinema operators using SeatVision increase premium seat conversion, reduce seat-selection hesitation, and gain spatial analytics on which rows underperform. Easily embed into existing web ticketing checkouts.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link href="/operators">
                  <Button variant="gold" size="md">
                    Explore Operator Console (Demo)
                  </Button>
                </Link>
                <Link href="/experiences">
                  <Button variant="outline" size="md">
                    Format Comparison Engine
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:col-span-4 bg-ink-950/80 p-6 rounded-2xl border border-ink-700/80 space-y-3 text-xs">
              <span className="font-mono text-gold-300 font-bold uppercase text-[11px] block">
                Platform Architecture
              </span>
              <ul className="space-y-2 text-ivory-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>Embeddable responsive web component</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>Auditorium laser blueprint survey schema</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>Concessions upselling add-on integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>Digital ticket passes with demo QR</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
