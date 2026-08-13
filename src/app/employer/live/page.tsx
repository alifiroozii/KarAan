"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { Map, MapCluster, WorkerMarker, BranchMarker } from "@/components/maps/map-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  MapPin,
  Filter,
  Users,
  ShieldCheck,
  Star,
  PlusCircle,
  Briefcase,
  ChevronLeft,
  X,
  Activity,
  Layers,
} from "lucide-react";

export interface RadarWorkerCandidate {
  id: string;
  maskedName: string;
  approxDistanceKm: number;
  rating: number;
  reliabilityScore: number;
  completedShifts: number;
  primarySkill: string;
  status: "AVAILABLE";
  approxLat: number;
  approxLng: number;
}

const SAMPLE_RADAR_WORKERS: RadarWorkerCandidate[] = [
  {
    id: "wrk_101",
    maskedName: "کارجو کد #1084",
    approxDistanceKm: 1.8,
    rating: 4.9,
    reliabilityScore: 98,
    completedShifts: 42,
    primarySkill: "انبارداری و چیدمان",
    status: "AVAILABLE",
    approxLat: 35.702,
    approxLng: 51.352,
  },
  {
    id: "wrk_102",
    maskedName: "کارجو کد #1092",
    approxDistanceKm: 3.4,
    rating: 4.7,
    reliabilityScore: 95,
    completedShifts: 28,
    primarySkill: "بسته‌بندی کالا",
    status: "AVAILABLE",
    approxLat: 35.708,
    approxLng: 51.361,
  },
  {
    id: "wrk_103",
    maskedName: "کارجو کد #1105",
    approxDistanceKm: 5.1,
    rating: 4.6,
    reliabilityScore: 92,
    completedShifts: 19,
    primarySkill: "صندوق‌داری",
    status: "AVAILABLE",
    approxLat: 35.695,
    approxLng: 51.341,
  },
];

export default function EmployerLiveMapPage() {
  const [selectedBranch, setSelectedBranch] = useState("branch_central");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [maxDistance, setMaxDistance] = useState("25");
  const [minRating, setMinRating] = useState("4.0");
  const [selectedWorker, setSelectedWorker] = useState<RadarWorkerCandidate | null>(null);

  // Filter candidates
  const filteredWorkers = SAMPLE_RADAR_WORKERS.filter((w) => {
    if (parseFloat(maxDistance) && w.approxDistanceKm > parseFloat(maxDistance)) return false;
    if (parseFloat(minRating) && w.rating < parseFloat(minRating)) return false;
    if (selectedRole !== "ALL" && !w.primarySkill.includes(selectedRole)) return false;
    return true;
  });

  return (
    <EmployerDashboardLayout>
      <div className="space-y-6 selection:bg-indigo-500 selection:text-white">
        {/* Top Header & Filter Controls */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl font-extrabold text-foreground">نقشه زنده رادار نیروها (Live Map)</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                مشاهده نیروهای آماده‌به‌کار با حفظ کامل حریم خصوصی (مختصات و هویت تقریبی قبل از ثبت شیفت)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { label: "شعبه مرکزی انقلاب (خیابان کارگر)", value: "branch_central" },
                  { label: "شعبه ونک (میدان ونک)", value: "branch_vanak" },
                ]}
              />
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            <Select
              label="فرصت شغلی"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              options={[
                { label: "همه مشاغل", value: "ALL" },
                { label: "انبارداری", value: "انبارداری" },
                { label: "بسته‌بندی", value: "بسته‌بندی" },
                { label: "صندوق‌داری", value: "صندوق‌داری" },
              ]}
            />
            <Select
              label="حداکثر فاصله"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              options={[
                { label: "تا ۵ کیلومتر", value: "5" },
                { label: "تا ۱۰ کیلومتر", value: "10" },
                { label: "تا ۲۵ کیلومتر", value: "25" },
              ]}
            />
            <Select
              label="حداقل امتیاز"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              options={[
                { label: "★ ۴.۰ به بالا", value: "4.0" },
                { label: "★ ۴.۵ به بالا", value: "4.5" },
              ]}
            />
            <div className="flex items-end">
              <Link href="/employer/shifts/new" className="w-full">
                <Button variant="emerald" className="w-full text-xs font-bold py-2.5">
                  <PlusCircle className="w-4 h-4 ml-1.5" />
                  ثبت شیفت جدید
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Live Map & Sidebar Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Map Container */}
          <div className="lg:col-span-2 relative">
            <Map className="w-full h-[450px] sm:h-[550px] rounded-3xl">
              {/* Branch Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <BranchMarker title="شعبه مرکزی انقلاب" />
              </div>

              {/* Workers Radar Pins */}
              <div className="absolute top-1/3 left-1/3 z-10 cursor-pointer" onClick={() => setSelectedWorker(filteredWorkers[0] || null)}>
                <WorkerMarker name={filteredWorkers[0]?.maskedName || "کارجو"} rating={filteredWorkers[0]?.rating} />
              </div>

              <div className="absolute bottom-1/3 right-1/3 z-10 cursor-pointer" onClick={() => setSelectedWorker(filteredWorkers[1] || null)}>
                <WorkerMarker name={filteredWorkers[1]?.maskedName || "کارجو"} rating={filteredWorkers[1]?.rating} />
              </div>

              <div className="absolute top-1/4 right-1/4 z-10">
                <MapCluster count={filteredWorkers.length} />
              </div>
            </Map>
          </div>

          {/* Worker Details Drawer / Sidebar */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            {selectedWorker ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      آماده دریافت شیفت (AVAILABLE)
                    </span>
                    <h3 className="text-base font-extrabold text-foreground mt-1">{selectedWorker.maskedName}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWorker(null)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Worker Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-muted/40 border border-border rounded-2xl space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[10px]">فاصله تقریبی</span>
                    <span className="font-extrabold text-foreground dir-ltr">حدود {selectedWorker.approxDistanceKm} کیلومتر</span>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border rounded-2xl space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[10px]">امتیاز ستاره‌ای</span>
                    <span className="font-extrabold text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {selectedWorker.rating} از ۵.۰
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border rounded-2xl space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[10px]">نمره اعتبار (Reliability)</span>
                    <span className="font-extrabold text-indigo-400">{selectedWorker.reliabilityScore}٪</span>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border rounded-2xl space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[10px]">شیفت‌های موفق</span>
                    <span className="font-extrabold text-emerald-400">{selectedWorker.completedShifts} شیفت</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs space-y-1">
                  <span className="text-indigo-400 font-bold block text-[10px]">مهارت اصلی:</span>
                  <p className="font-semibold text-foreground">{selectedWorker.primarySkill}</p>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  نام کامل و اطلاعات ارتباطی دقیق این نیرو، پس از انتشار و تایید شیفت در دسترس قرار خواهد گرفت.
                </p>

                <Link href={`/employer/shifts/new?role=${encodeURIComponent(selectedWorker.primarySkill)}`}>
                  <Button variant="emerald" className="w-full text-xs font-bold py-3 mt-2">
                    <PlusCircle className="w-4 h-4 ml-1.5" />
                    ثبت شیفت کاری برای این نیرو
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">روی مارکر یکی از نیروها کلیک کنید</p>
                  <p className="text-xs text-muted-foreground">
                    مشخصات، امتیاز ستاره‌ای و نمره اعتبار کارجو در این بخش قرار می‌گیرد.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployerDashboardLayout>
  );
}
