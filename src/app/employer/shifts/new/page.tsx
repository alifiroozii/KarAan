"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/toggle-controls";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { CurrencyDisplay } from "@/components/ui/domain-displays";
import {
  Briefcase,
  Users,
  Clock,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  Coffee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const createShiftSchema = z.object({
  jobTitle: z.string().min(3, "عنوان شیفت باید حداقل ۳ حرف باشد."),
  requiredWorkers: z.string().min(1, "تعداد نیرو الزامی است."),
  shiftType: z.enum(["HOURLY", "FULL_SHIFT", "ASAP", "DAILY", "MULTI_DAY", "RECURRING"]),
  startDate: z.string().min(1, "تاریخ شروع الزامی است."),
  startTime: z.string().min(1, "ساعت شروع الزامی است."),
  endTime: z.string().min(1, "ساعت پایان الزامی است."),
  branchId: z.string().min(1, "انتخاب شعبه الزامی است."),
  hourlyPayRials: z.string().min(1, "مبلغ دستمزد ساعتی الزامی است."),
  minRating: z.string().min(1, "حداقل امتیاز الزامی است."),
  minReliability: z.string().min(1, "حداقل نمره اعتبار الزامی است."),
  dressCode: z.string().optional(),
  toolsNeeded: z.string().optional(),
  checkinInstructions: z.string().optional(),
  supervisorPhone: z.string().optional(),
  breakMinutes: z.string().min(1, "زمان استراحت الزامی است."),
  isPaidBreak: z.boolean(),
});

type CreateShiftFormValues = z.infer<typeof createShiftSchema>;

export default function CreateShiftWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      jobTitle: "انباردار و چیدمان کالا (شیفت عصر)",
      requiredWorkers: "3",
      shiftType: "HOURLY",
      startDate: "1403/05/25",
      startTime: "16:00",
      endTime: "20:00",
      branchId: "branch_central",
      hourlyPayRials: "1500000",
      minRating: "4.5",
      minReliability: "95",
      dressCode: "لباس کار سرمه‌ای یا مشکی تمیز",
      toolsNeeded: "کفش ایمنی، دستکش کار",
      checkinInstructions: "مراجعه به دفتر سرپرست انبار در انتهای فروشگاه",
      supervisorPhone: "09121112233",
      breakMinutes: "30",
      isPaidBreak: false,
    },
  });

  const watchHourly = watch("hourlyPayRials");
  const watchWorkers = watch("requiredWorkers");
  const hourlyVal = BigInt(parseInt(watchHourly || "0", 10) || 0);
  const workersVal = parseInt(watchWorkers || "1", 10) || 1;
  const estimatedBudgetRials = hourlyVal * BigInt(4) * BigInt(workersVal); // 4 hours shift

  const handleNextStep = () => {
    if (step < 10) setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call to create Shift and auto-generate ShiftSlots
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push("/employer?shift_created=true");
    } catch {
      alert("خطا در ایجاد شیفت کاری");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmployerDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 selection:bg-indigo-500 selection:text-white">
        {/* Wizard Header Progress Indicator */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">ایجاد شیفت کاری جدید (ایجاد اتوماتیک اسلات‌ها)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                تنظیم دقیق عنوان، تعداد نیرو، دستمزد ساعتی، قوانین حضور و انتشار در رادار پلتفرم
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/30">
              گام {step} از ۱۰
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Job Role Selection */}
          {step === 1 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>گام ۱: انتخاب عنوان شغلی و عنوان شیفت</span>
              </div>
              <Input
                label="عنوان شیفت کاری"
                placeholder="مثال: انباردار و چیدمان فروشگاهی"
                {...register("jobTitle")}
                error={errors.jobTitle?.message}
              />
            </div>
          )}

          {/* Step 2: Worker Capacity */}
          {step === 2 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>گام ۲: تعداد نیروی مورد نیاز (تولید اتوماتیک ShiftSlot)</span>
              </div>
              <Input
                label="تعداد نیروهای همزمان"
                type="number"
                placeholder="3"
                {...register("requiredWorkers")}
                error={errors.requiredWorkers?.message}
              />
              <p className="text-xs text-muted-foreground">
                به تعداد نیروهای وارد شده، اسلات‌های مجزا (ShiftSlots) به صورت خودکار ایجاد خواهد شد.
              </p>
            </div>
          )}

          {/* Step 3: Shift Type */}
          {step === 3 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>گام ۳: انتخاب نوع شیفت کاری</span>
              </div>
              <Select
                label="نوع شیفت"
                options={[
                  { label: "ساعتی (HOURLY)", value: "HOURLY" },
                  { label: "تمام شیفت (FULL_SHIFT)", value: "FULL_SHIFT" },
                  { label: "فوری (ASAP)", value: "ASAP" },
                  { label: "روزانه (DAILY)", value: "DAILY" },
                  { label: "چند روزه (MULTI_DAY)", value: "MULTI_DAY" },
                  { label: "تکرارشونده (RECURRING)", value: "RECURRING" },
                ]}
              />
            </div>
          )}

          {/* Step 4: Date & Time */}
          {step === 4 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>گام ۴: تاریخ و زمان برگزاری شیفت</span>
              </div>
              <Input label="تاریخ شروع (شمسی)" placeholder="1403/05/25" {...register("startDate")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="ساعت شروع" placeholder="16:00" {...register("startTime")} />
                <Input label="ساعت پایان" placeholder="20:00" {...register("endTime")} />
              </div>
            </div>
          )}

          {/* Step 5: Branch Selection */}
          {step === 5 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>گام ۵: انتخاب شعبه محل خدمت</span>
              </div>
              <Select
                label="شعبه"
                options={[
                  { label: "شعبه مرکزی انقلاب (خیابان کارگر شمالی)", value: "branch_central" },
                  { label: "شعبه ونک (میدان ونک)", value: "branch_vanak" },
                ]}
              />
            </div>
          )}

          {/* Step 6: Pay Structure */}
          {step === 6 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>گام ۶: ساختار دستمزد و بودجه پرداختی (ریال)</span>
              </div>
              <Input
                label="دستمزد ساعتی هر نیرو (ریال)"
                placeholder="1,500,000"
                {...register("hourlyPayRials")}
                error={errors.hourlyPayRials?.message}
              />
              <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">تخمین بودجه کل سپرده شیفت:</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  <CurrencyDisplay amountRials={estimatedBudgetRials} />
                </span>
              </div>
            </div>
          )}

          {/* Step 7: Requirements */}
          {step === 7 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>گام ۷: شرایط و معیارهای پذیرش نیرو</span>
              </div>
              <Input label="حداقل امتیاز ستاره‌ای نیرو" placeholder="4.5" {...register("minRating")} />
              <Input label="حداقل نمره اعتبار (Reliability Score)" placeholder="95" {...register("minReliability")} />
            </div>
          )}

          {/* Step 8: Instructions */}
          {step === 8 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>گام ۸: راهنما و دستورالعمل‌های ورود نیرو</span>
              </div>
              <Input label="پوشش و لباس کار (Dress Code)" placeholder="لباس کار سرمه‌ای یا مشکی" {...register("dressCode")} />
              <Input label="ابزار و تجهیزات همراه" placeholder="کفش ایمنی، دستکش کار" {...register("toolsNeeded")} />
              <Textarea label="نحوه ورود و معرفی به سرپرست" placeholder="مراجعه به دفتر سرپرستی..." {...register("checkinInstructions")} />
              <Input label="شماره تماس سرپرست شیفت" placeholder="09121112233" {...register("supervisorPhone")} />
            </div>
          )}

          {/* Step 9: Break & Overtime */}
          {step === 9 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <Coffee className="w-5 h-5 text-indigo-400" />
                <span>گام ۹: تنظیمات زمان استراحت (Break)</span>
              </div>
              <Input label="مدت زمان استراحت (دقیقه)" placeholder="30" {...register("breakMinutes")} />
              <Checkbox
                label="استراحت با پرداخت حقوق (Paid Break)"
                checked={watch("isPaidBreak")}
                onChange={(checked) => setValue("isPaidBreak", checked)}
              />
            </div>
          )}

          {/* Step 10: Review & Publish */}
          {step === 10 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>گام ۱۰: مرور نهایی و انتشار در رادار پلتفرم (Publish)</span>
              </div>

              <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عنوان شیفت:</span>
                  <span className="font-bold text-foreground">{watch("jobTitle")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تعداد نیرو:</span>
                  <span className="font-bold text-foreground">{watch("requiredWorkers")} نفر</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">بودجه کل سپرده:</span>
                  <span className="font-bold text-emerald-400">
                    <CurrencyDisplay amountRials={estimatedBudgetRials} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                <ChevronRight className="w-4 h-4 ml-1" />
                مرحله قبلی
              </Button>
            ) : (
              <div />
            )}

            {step < 10 ? (
              <Button type="button" onClick={handleNextStep}>
                مرحله بعدی
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            ) : (
              <Button type="submit" variant="emerald" className="px-6 font-bold" disabled={isSubmitting}>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                {isSubmitting ? "در حال انتشار..." : "تایید و انتشار شیفت (Publish)"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </EmployerDashboardLayout>
  );
}
