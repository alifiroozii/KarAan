"use client";

import React, { useState, useEffect } from "react";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch, Checkbox } from "@/components/ui/toggle-controls";
import { CurrencyDisplay } from "@/components/ui/domain-displays";
import {
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Activity,
  Heart,
} from "lucide-react";

export type WorkerPresenceStatus = "OFFLINE" | "AVAILABLE" | "BUSY" | "WORKING";

export default function WorkerAvailabilityPage() {
  const [status, setStatus] = useState<WorkerPresenceStatus>("AVAILABLE");
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState("15");
  const [minPayRials, setMinPayRials] = useState("1500000");
  const [availableUntil, setAvailableUntil] = useState("22:00");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["انبارداری", "بسته‌بندی"]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>("چند لحظه پیش");

  // Simulated Heartbeat timer (sends heartbeat every 30s)
  useEffect(() => {
    if (!isAvailable) return;
    const interval = setInterval(() => {
      setLastHeartbeat(new Date().toLocaleTimeString("fa-IR"));
    }, 30000);
    return () => clearInterval(interval);
  }, [isAvailable]);

  const handleToggleAvailable = (checked: boolean) => {
    setIsAvailable(checked);
    setStatus(checked ? "AVAILABLE" : "OFFLINE");
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert("تنظیمات آمادگی با موفقیت ذخیره شد.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WorkerMobileLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto selection:bg-indigo-500 selection:text-white">
        {/* Main Status & Availability Toggle Switch Card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground block">وضعیت فعلی رادار</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    status === "AVAILABLE"
                      ? "bg-emerald-500 animate-pulse"
                      : status === "WORKING"
                      ? "bg-indigo-500"
                      : status === "BUSY"
                      ? "bg-amber-500"
                      : "bg-slate-500"
                  }`}
                />
                <h2 className="text-base font-extrabold text-foreground">
                  {status === "AVAILABLE"
                    ? "آماده دریافت شیفت (AVAILABLE)"
                    : status === "WORKING"
                    ? "در حال انجام شیفت (WORKING)"
                    : status === "BUSY"
                    ? "مشغول (BUSY)"
                    : "آفلاین (OFFLINE)"}
                </h2>
              </div>
            </div>

            <Switch checked={isAvailable} onChange={handleToggleAvailable} />
          </div>

          <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-semibold">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>پالس ضربان قلب زنده (Heartbeat)</span>
            </div>
            <span className="font-bold text-emerald-400 dir-ltr">{lastHeartbeat}</span>
          </div>
        </div>

        {/* Real-time Preferences Settings */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>تنظیمات آمادگی زنده</span>
          </div>

          <Input
            label="حداکثر زمان آمادگی امروز"
            type="text"
            placeholder="22:00"
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
          />

          <Input
            label="حداکثر شعاع پاسخگویی به شیفت (کیلومتر)"
            type="number"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(e.target.value)}
          />

          <Input
            label="حداقل دستمزد ساعتی مورد قبول (ریال)"
            type="text"
            value={minPayRials}
            onChange={(e) => setMinPayRials(e.target.value)}
          />

          {/* Job Roles Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">فرصت‌های شغلی مورد علاقه</label>
            <div className="grid grid-cols-2 gap-2">
              {["انبارداری", "بسته‌بندی", "فروشندگی", "پیک موتوری", "صندوق‌داری"].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() =>
                    setSelectedRoles((prev) =>
                      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                    )
                  }
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedRoles.includes(role)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Availability Calendar Matrix */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>تقویم هفتگی زمان‌های آزاد (Weekly Calendar)</span>
          </div>

          <div className="space-y-2 text-xs">
            {["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه"].map((day) => (
              <div key={day} className="flex items-center justify-between p-3 bg-muted/30 border border-border/60 rounded-2xl">
                <Checkbox label={day} checked={true} onChange={() => {}} />
                <span className="font-semibold text-muted-foreground dir-ltr">08:00 - 18:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button onClick={handleSavePreferences} className="w-full text-xs font-bold py-3" disabled={isSaving}>
          <CheckCircle2 className="w-4 h-4 ml-1.5" />
          {isSaving ? "در حال ذخیره‌سازی..." : "ذخیره تنظیمات آمادگی"}
        </Button>
      </div>
    </WorkerMobileLayout>
  );
}
