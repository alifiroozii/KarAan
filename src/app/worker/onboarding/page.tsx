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
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import {
  User,
  Upload,
  MapPin,
  Briefcase,
  Clock,
  CreditCard,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const onboardingSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد."),
  bio: z.string().optional(),
  city: z.string().min(1, "انتخاب شهر الزامی است."),
  radiusKm: z.string().min(1, "شعاع فعالیت الزامی است."),
  hourlyRateRials: z.string().min(1, "تعیین نرخ درخواستی الزامی است."),
  bankIban: z
    .string()
    .min(24, "شماره شبا باید ۲۴ رقم بدون IR باشد.")
    .max(26, "شماره شبا نامعتبر است."),
  acceptedTerms: z.boolean().refine((val) => val === true, "پذیرش قوانین الزامی است."),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function WorkerOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["انبارداری", "بسته‌بندی"]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "علی رضایی",
      bio: "نیروی باسابقه انبارداری و چیدمان فروشگاهی",
      city: "tehran",
      radiusKm: "15",
      hourlyRateRials: "1500000",
      bankIban: "IR120150000000012345678901",
      acceptedTerms: true,
    },
  });

  const handleNextStep = () => {
    if (step < 10) setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate submission of full 10-step worker profile onboarding
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/worker?onboarded=true");
    } catch {
      alert("خطا در ثبت اطلاعات آنلاین");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkerMobileLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto selection:bg-indigo-500 selection:text-white">
        {/* Step Header Indicator */}
        <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400">
              گام {step} از ۱۰ | آنبوردینگ کارجو
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              {Math.round((step / 10) * 100)}٪ تکمیل شده
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <User className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۱: اطلاعات شخصی</h3>
              </div>
              <Input
                label="نام و نام خانوادگی"
                placeholder="مثال: علی رضایی"
                {...register("fullName")}
                error={errors.fullName?.message}
              />
              <Textarea
                label="درباره من (بیوگرافی کاری)"
                placeholder="خلاصه‌ای از توانمندی‌ها و سوابق کاری..."
                {...register("bio")}
              />
            </div>
          )}

          {/* Step 2: Profile Photo Upload */}
          {step === 2 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4 text-center">
              <div className="flex items-center gap-3 border-b border-border pb-3 text-right">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۲: تصویر پرسنلی</h3>
              </div>
              <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-3 bg-muted/30">
                <div className="w-20 h-20 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                  {profilePhotoUrl ? "✓" : <User className="w-10 h-10" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  تصویر واضح پرسنلی جهت شناسایی در محل شیفت کاری
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProfilePhotoUrl("/mock-avatar.jpg")}
                >
                  آپلود عکس در S3 Storage
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: City & Location */}
          {step === 3 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۳: شهر و محدوده فعالیت</h3>
              </div>
              <Select
                label="شهر اصلی فعالیت"
                options={[
                  { label: "تهران", value: "tehran" },
                  { label: "کرج", value: "karaj" },
                  { label: "اصفهان", value: "isfahan" },
                ]}
              />
              <Input label="شعاع پاسخگویی به شیفت (کیلومتر)" defaultValue="15" />
            </div>
          )}

          {/* Step 4: Skills Selection */}
          {step === 4 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۴: انتخاب مهارت‌ها</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["انبارداری", "بسته‌بندی", "فروشندگی", "پیک موتوری", "صندوق‌داری"].map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() =>
                      setSelectedSkills((prev) =>
                        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                      )
                    }
                    className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedSkills.includes(skill)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Work Experience */}
          {step === 5 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۵: سابقه کاری مرتبط</h3>
              </div>
              <Select
                label="میزان سابقه کار"
                options={[
                  { label: "کمتر از ۱ سال", value: "1" },
                  { label: "۱ تا ۳ سال", value: "3" },
                  { label: "بیش از ۳ سال", value: "5" },
                ]}
              />
            </div>
          )}

          {/* Step 6: Preferred Hourly Rate */}
          {step === 6 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۶: نرخ ساعتی درخواستی (ریال)</h3>
              </div>
              <Input
                label="پیشنهاد دستمزد ساعتی (ریال)"
                placeholder="1,500,000"
                {...register("hourlyRateRials")}
                error={errors.hourlyRateRials?.message}
              />
            </div>
          )}

          {/* Step 7: Availability Schedule */}
          {step === 7 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۷: زمان‌های آزاد کاری</h3>
              </div>
              <div className="space-y-2">
                {["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه"].map((day) => (
                  <Checkbox key={day} label={`شیفت‌های صبح و عصر ${day}`} checked={true} onChange={() => {}} />
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Bank IBAN */}
          {step === 8 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۸: اطلاعات حساب و شبا</h3>
              </div>
              <Input
                label="شماره شبا (IBAN)"
                placeholder="IR120150000000012345678901"
                {...register("bankIban")}
                error={errors.bankIban?.message}
              />
            </div>
          )}

          {/* Step 9: Identity Documents */}
          {step === 9 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4 text-center">
              <div className="flex items-center gap-3 border-b border-border pb-3 text-right">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-foreground">گام ۹: آپلود مدارک احراز هویت</h3>
              </div>
              <div className="p-6 border-2 border-dashed border-border rounded-2xl space-y-2">
                <p className="text-xs text-muted-foreground">تصویر کارت ملی یا شناسنامه جدید</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDocumentUrl("/mock-doc.jpg")}
                >
                  آپلود مدرک در MinIO S3
                </Button>
              </div>
            </div>
          )}

          {/* Step 10: Terms & Verification Agreement */}
          {step === 10 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-foreground">گام ۱۰: تایید نهایی و پذیرش قوانین</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                اینجانب صحت تمامی اطلاعات وارد شده و قوانین حضور به موقع در شیفت کاری کارآن را می‌پذیرم.
              </p>
              <Checkbox
                label="پذیرش قوانین و شرایط خدمت‌رسانی کارآن"
                checked={true}
                onChange={(v) => setValue("acceptedTerms", v)}
              />
            </div>
          )}

          {/* Step Controls Buttons */}
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
              <Button type="submit" variant="emerald" disabled={isSubmitting}>
                <CheckCircle2 className="w-4 h-4 ml-1" />
                {isSubmitting ? "در حال ثبت..." : "تکمیل آنبوردینگ"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </WorkerMobileLayout>
  );
}
