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
import { LocationPicker } from "@/components/maps/location-picker";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { Building2, MapPin, Store, CheckCircle2, ChevronRight } from "lucide-react";

const employerOnboardingSchema = z.object({
  companyName: z.string().min(3, "نام شرکت یا فروشگاه باید حداقل ۳ حرف باشد."),
  nationalCode: z.string().min(10, "کد ملی/شناسه ملی باید ۱۰ یا ۱۱ رقم باشد."),
  businessName: z.string().min(3, "نام برند تجاری الزامی است."),
  category: z.string().min(1, "انتخاب دسته‌بندی الزامی است."),
  description: z.string().optional(),
  branchName: z.string().min(2, "نام شعبه الزامی است."),
  address: z.string().min(5, "آدرس کامل شعب الزامی است."),
  phone: z.string().min(8, "شماره تماس شعبه الزامی است."),
  latitude: z.number(),
  longitude: z.number(),
});

type EmployerOnboardingForm = z.infer<typeof employerOnboardingSchema>;

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployerOnboardingForm>({
    resolver: zodResolver(employerOnboardingSchema),
    defaultValues: {
      companyName: "فروشگاه‌های زنجیره‌ای آریا",
      nationalCode: "10101234567",
      businessName: "هایپرمارکت آریا",
      category: "فروشگاهی",
      description: "مجموعه فروشگاه‌های زنجیره‌ای مواد غذایی و مصرفی",
      branchName: "شعبه مرکزی انقلاب",
      address: "تهران، میدان انقلاب، خیابان کارگر شمالی، پلاک ۱۲",
      phone: "02166400000",
      latitude: 35.7000,
      longitude: 51.3500,
    },
  });

  const onSubmit = async (data: EmployerOnboardingForm) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/employer?onboarded=true");
    } catch {
      alert("خطا در ایجاد پروفایل کارفرما");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmployerDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 selection:bg-indigo-500 selection:text-white">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">آنبوردینگ کارفرما و ساخت شعبه اول</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                اطلاعات کسب‌وکار و شعبه اصلی خود را جهت انتشار شیفت کاری ثبت کنید.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30">
              مرحله {step} از ۳
            </span>
          </div>

          {/* Steps Breadcrumb */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-bold">
            <div className={`p-2 rounded-xl border ${step === 1 ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"}`}>
              ۱. پروفایل حقوقی
            </div>
            <div className={`p-2 rounded-xl border ${step === 2 ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"}`}>
              ۲. تعریف برند
            </div>
            <div className={`p-2 rounded-xl border ${step === 3 ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"}`}>
              ۳. ساخت شعبه و نقشه
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border pb-3">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>گام ۱: مشخصات حقوقی کارفرما</span>
              </div>
              <Input
                label="نام شرکت یا کسب‌وکار"
                placeholder="مثال: فروشگاه‌های زنجیره‌ای آریا"
                {...register("companyName")}
                error={errors.companyName?.message}
              />
              <Input
                label="شناسه ملی / کد ملی"
                placeholder="10101234567"
                {...register("nationalCode")}
                error={errors.nationalCode?.message}
              />
              <Button type="button" onClick={() => setStep(2)} className="w-full">
                ادامه به ساخت برند
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border pb-3">
                <Store className="w-5 h-5 text-indigo-400" />
                <span>گام ۲: تعریف برند تجاری (Business)</span>
              </div>
              <Input
                label="نام تجاری برند"
                placeholder="هایپرمارکت آریا"
                {...register("businessName")}
                error={errors.businessName?.message}
              />
              <Select
                label="دسته‌بندی فعالیت"
                options={[
                  { label: "فروشگاهی و هایپرمارکت", value: "فروشگاهی" },
                  { label: "انبارداری و لوجستیک", value: "لوجستیک" },
                  { label: "رستوران و تشریفات", value: "تشریفات" },
                ]}
              />
              <Textarea
                label="توضیحات برند"
                placeholder="توضیحات مختصر درباره فعالیت شرکت..."
                {...register("description")}
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  قبلی
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="w-full">
                  ادامه به تعریف شعبه و نقشه
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border pb-3">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>گام ۳: ساخت شعبه اصلی و تعیین روی نقشه</span>
              </div>
              <Input
                label="نام شعبه"
                placeholder="شعبه مرکزی انقلاب"
                {...register("branchName")}
                error={errors.branchName?.message}
              />
              <Input
                label="آدرس دقیق پستی"
                placeholder="تهران، میدان انقلاب..."
                {...register("address")}
                error={errors.address?.message}
              />
              <Input
                label="شماره تلفن ثابت شعبه"
                placeholder="02166400000"
                {...register("phone")}
                error={errors.phone?.message}
              />

              <LocationPicker
                onLocationSelect={(lat, lng) => {
                  setValue("latitude", lat);
                  setValue("longitude", lng);
                }}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  قبلی
                </Button>
                <Button type="submit" variant="emerald" className="w-full" disabled={isSubmitting}>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  {isSubmitting ? "در حال ساخت شعبه..." : "تکمیل و ورود به پنل کارفرما"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </EmployerDashboardLayout>
  );
}
