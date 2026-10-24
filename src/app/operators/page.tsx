import React from "react";
import Link from "next/link";
import {
  Building2,
  Layers,
  Camera,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { getRepository } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OperatorsDashboardPage() {
  const repo = getRepository();

  const [auditoriums, cinemas, screenings] = await Promise.all([
    repo.listAuditoriums(),
    repo.listCinemas(),
    repo.listScreenings(),
  ]);

  const totalSeats = auditoriums.reduce((acc, a) => acc + a.seats.length, 0);
  const surveyedCount = auditoriums.filter(
    (a) => a.geometry.positionMethod === "surveyed"
  ).length;

  return (
    <div className="container-page py-8 space-y-8">
      {/* Top Banner Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-amber-200">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-300 mr-2">
              B2B Operator Demo Environment:
            </span>
            <span>
              This management console demonstrates layout surveying, panorama verification workflows, and spatial booking analytics for theatre partners. No authentication is enforced in demo mode.
            </span>
          </div>
        </div>
        <Badge variant="warning" className="whitespace-nowrap">
          Simulated Data
        </Badge>
      </div>

      {/* Header */}
      <div className="border-b border-ink-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Enterprise SaaS</span>
          <h1 className="text-3xl font-bold text-ivory-50 flex items-center gap-3">
            Cinema Operator Control Centre
            <Building2 className="w-6 h-6 text-gold-400" />
          </h1>
          <p className="text-xs text-ivory-400 mt-1">
            Manage auditorium spatial coordinates, preview assets, and monitor SeatMatch conversion lift.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Export Coordinate GeoJSON
          </Button>
          <Button variant="gold" size="sm">
            + New Hall Blueprint
          </Button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-ink-900 border-ink-800 p-5 space-y-1">
          <span className="text-xs text-ivory-400 flex items-center justify-between">
            Auditoriums Managed
            <Layers className="w-4 h-4 text-gold-400" />
          </span>
          <div className="text-2xl font-bold text-ivory-50 font-mono">
            {auditoriums.length}
          </div>
          <span className="text-[11px] text-ivory-500">
            Across {cinemas.length} cinema locations
          </span>
        </div>

        <div className="card bg-ink-900 border-ink-800 p-5 space-y-1">
          <span className="text-xs text-ivory-400 flex items-center justify-between">
            Total Mapped Seats
            <BarChart3 className="w-4 h-4 text-gold-400" />
          </span>
          <div className="text-2xl font-bold text-ivory-50 font-mono">{totalSeats}</div>
          <span className="text-[11px] text-sage-400">100% indexed with explicit adjacency</span>
        </div>

        <div className="card bg-ink-900 border-ink-800 p-5 space-y-1">
          <span className="text-xs text-ivory-400 flex items-center justify-between">
            Geometry Surveyed
            <CheckCircle2 className="w-4 h-4 text-sage-400" />
          </span>
          <div className="text-2xl font-bold text-ivory-50 font-mono">
            {surveyedCount} of {auditoriums.length}
          </div>
          <span className="text-[11px] text-ivory-500">
            {auditoriums.length - surveyedCount} estimated from architectural plans
          </span>
        </div>

        <div className="card bg-ink-900 border-ink-800 p-5 space-y-1">
          <span className="text-xs text-ivory-400 flex items-center justify-between">
            Panorama Capture Status
            <Camera className="w-4 h-4 text-amber-400" />
          </span>
          <div className="text-2xl font-bold text-ivory-50 font-mono">0 Verified</div>
          <span className="text-[11px] text-amber-300">
            100% falling back to verified simulation
          </span>
        </div>
      </div>

      {/* Auditoriums Management Table */}
      <div className="card bg-ink-900 border-ink-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-ivory-100">Configured Auditoriums</h2>
            <p className="text-xs text-ivory-400">
              Audit coordinate models, screen widths, and physical aisle links.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ivory-300">
            <thead className="bg-ink-850 text-ivory-400 uppercase font-mono text-[10px] border-b border-ink-800">
              <tr>
                <th className="px-4 py-3">Auditorium Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Screen Width</th>
                <th className="px-4 py-3">Seat Count</th>
                <th className="px-4 py-3">Survey Status</th>
                <th className="px-4 py-3 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/80">
              {auditoriums.map((aud) => {
                const cinema = cinemas.find((c) => c.id === aud.cinemaId);
                const sampleScreening = screenings.find((s) => s.auditoriumId === aud.id);

                return (
                  <tr key={aud.id} className="hover:bg-ink-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-ivory-100">{aud.name}</td>
                    <td className="px-4 py-3 text-ivory-400">{cinema?.name}</td>
                    <td className="px-4 py-3 capitalize">
                      <Badge variant="secondary" className="text-[10px]">
                        {aud.format}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {aud.geometry.screen?.widthM
                        ? `${aud.geometry.screen.widthM}m`
                        : "Unknown"}
                    </td>
                    <td className="px-4 py-3 font-mono">{aud.seats.length} seats</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          aud.geometry.positionMethod === "surveyed" ? "success" : "warning"
                        }
                        className="text-[10px]"
                      >
                        {aud.geometry.positionMethod}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sampleScreening ? (
                        <Link
                          href={`/screenings/${sampleScreening.id}`}
                          className="text-gold-400 hover:text-gold-300 inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Open Map</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-ivory-500">No showtimes</span>
                      )}
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
