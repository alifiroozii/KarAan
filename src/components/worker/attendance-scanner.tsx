"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/hooks/use-location";

export type AttendancePurpose = "CHECK_IN" | "CHECK_OUT";

type DetectorResult = { rawValue: string };
type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<DetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

function getDeviceId(): string {
  const key = "karaan_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

async function readResult(response: Response) {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "ثبت حضور ناموفق بود.");
  }
  return body.data;
}

export function AttendanceScanner({
  assignmentId,
  branchId,
  purpose,
}: {
  assignmentId: string;
  branchId: string;
  purpose: AttendancePurpose;
}) {
  const queryClient = useQueryClient();
  const location = useLocation(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastDetectRef = useRef(0);
  const [mode, setMode] = useState<"idle" | "camera" | "code">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stopCamera = () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const attendanceMutation = useMutation({
    mutationFn: async (input: { qrToken?: string; supervisorCode?: string }) => {
      if (
        location.latitude == null ||
        location.longitude == null ||
        location.accuracy == null
      ) {
        throw new Error("برای ثبت حضور باید GPS دقیق فعال باشد.");
      }

      const common = {
        assignmentId,
        purpose,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        deviceId: getDeviceId(),
      };

      if (input.qrToken) {
        return readResult(
          await fetch("/api/attendance/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...common, qrToken: input.qrToken }),
          })
        );
      }

      return readResult(
        await fetch("/api/attendance/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            branchId,
            code: input.supervisorCode,
          }),
        })
      );
    },
    onSuccess: () => {
      stopCamera();
      setSuccessMessage(
        purpose === "CHECK_IN" ? "ورود شما با موفقیت ثبت شد." : "خروج شما با موفقیت ثبت شد."
      );
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
    },
  });

  const startCamera = async () => {
    setCameraError(null);
    setSuccessMessage(null);

    const Detector = (
      window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!Detector) {
      setCameraError("اسکن QR در این مرورگر پشتیبانی نمی‌شود؛ از کد مسئول استفاده کنید.");
      setMode("code");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("دسترسی دوربین در این مرورگر موجود نیست.");
      setMode("code");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");

      requestAnimationFrame(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        void videoRef.current.play();

        const detector = new Detector({ formats: ["qr_code"] });
        const loop = async (timestamp: number) => {
          if (!videoRef.current || attendanceMutation.isPending) return;

          if (timestamp - lastDetectRef.current >= 350) {
            lastDetectRef.current = timestamp;
            try {
              const results = await detector.detect(videoRef.current);
              const token = results[0]?.rawValue?.trim();
              if (token) {
                stopCamera();
                attendanceMutation.mutate({ qrToken: token });
                return;
              }
            } catch {
              // A transient video-frame decoding failure should not stop scanning.
            }
          }
          frameRef.current = requestAnimationFrame(loop);
        };
        frameRef.current = requestAnimationFrame(loop);
      });
    } catch {
      setCameraError("اجازه دوربین داده نشد یا دوربین در دسترس نیست.");
      setMode("code");
    }
  };

  useEffect(() => () => stopCamera(), []);

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <ShieldCheck className="h-5 w-5 text-indigo-400" />
        {purpose === "CHECK_IN" ? "ثبت ورود امن" : "ثبت خروج امن"}
      </div>

      {mode === "camera" ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-h-72">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
          </div>
          <Button variant="outline" className="w-full" onClick={() => { stopCamera(); setMode("idle"); }}>
            <XCircle className="ml-2 h-4 w-4" />
            بستن دوربین
          </Button>
        </div>
      ) : mode === "code" ? (
        <div className="space-y-3">
          <p className="text-xs leading-6 text-muted-foreground">
            کد ۶ رقمی کوتاه‌عمر را از مسئول شعبه دریافت کنید.
          </p>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="مثلاً ۴۸۲۹۳۱"
            dir="ltr"
            className="text-center text-lg tracking-[0.35em]"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={code.length !== 6 || attendanceMutation.isPending}
              onClick={() => attendanceMutation.mutate({ supervisorCode: code })}
            >
              {attendanceMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Keyboard className="ml-2 h-4 w-4" />
              )}
              ثبت کد
            </Button>
            <Button variant="outline" onClick={() => setMode("idle")}>
              بازگشت
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button onClick={() => void startCamera()} disabled={location.loading}>
            <QrCode className="ml-2 h-4 w-4" />
            اسکن QR
          </Button>
          <Button variant="outline" onClick={() => setMode("code")}>
            <Keyboard className="ml-2 h-4 w-4" />
            کد مسئول
          </Button>
        </div>
      )}

      {location.loading && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          در حال دریافت GPS دقیق...
        </p>
      )}
      {cameraError && <p className="text-xs text-amber-300">{cameraError}</p>}
      {attendanceMutation.error && (
        <p className="text-xs text-red-300">{attendanceMutation.error.message}</p>
      )}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Camera className="h-3.5 w-3.5" />
        QR کوتاه‌عمر است و مکان شما نیز سمت سرور بررسی می‌شود.
      </p>
    </div>
  );
}
