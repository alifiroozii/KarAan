"use client";

import React, { useState } from "react";
import {
  Button,
  IconButton,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox, Switch } from "@/components/ui/toggle-controls";
import { Dialog, BottomSheet } from "@/components/ui/dialogs";
import { Badge, Avatar, Tabs } from "@/components/ui/display-elements";
import {
  StatCard,
  StatusBadge,
  RatingStars,
  ReliabilityBadge,
  CurrencyDisplay,
} from "@/components/ui/domain-displays";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  Pagination,
  DataTableShell,
} from "@/components/ui/feedback-and-tables";
import { MapPin, Search, Moon, Sun, Check, Plus, User } from "lucide-react";
import { useTheme } from "next-themes";

export default function DesignSystemShowcase() {
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("COMPONENTS");
  const [checkboxState, setCheckboxState] = useState(true);
  const [switchState, setSwitchState] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [comboboxValue, setComboboxValue] = useState("tehran");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-10 max-w-6xl mx-auto selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">سیستم طراحی پلتفرم کارآن (Design System)</h1>
          <p className="text-xs text-muted-foreground mt-1">
            مجموعه کامل توکن‌ها، کامپوننت‌های Reusable و چیدمان‌های استاندارد برنامه
          </p>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-3 rounded-2xl bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          <span>تغییر به تم {theme === "dark" ? "روشن" : "تاریک"}</span>
        </button>
      </div>

      <Tabs
        tabs={[
          { id: "COMPONENTS", label: "کامپوننت‌های UI پایه" },
          { id: "DOMAIN", label: "نمایشگرهای دامنه‌ای و کارت‌ها" },
          { id: "FEEDBACK", label: "جدول و وضعیت‌های فیدبک" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "COMPONENTS" && (
        <div className="space-y-8">
          {/* Buttons Section */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">دکمه‌ها (Button & IconButton)</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">دکمه اصلی (Primary)</Button>
              <Button variant="emerald">دکمه موفقیت (Emerald)</Button>
              <Button variant="outline">دکمه حاشیه‌دار (Outline)</Button>
              <Button variant="secondary">دکمه ثانویه (Secondary)</Button>
              <Button variant="destructive">دکمه خطر (Destructive)</Button>
              <IconButton icon={<Search className="w-4 h-4" />} label="جستجو" />
              <IconButton icon={<Plus className="w-4 h-4" />} label="افزودن" variant="emerald" />
            </div>
          </section>

          {/* Form Inputs Section */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">ورودی‌های فرم (Inputs & Controls)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="عنوان ورودی متن" placeholder="مثال: علی رضایی" icon={<User className="w-4 h-4" />} />
              <Input label="ورودی دارای خطا" placeholder="نامعتبر" error="فرمت شماره تماس صحیح نیست" />
              <Select
                label="انتخاب شهر"
                options={[
                  { label: "تهران", value: "tehran" },
                  { label: "کرج", value: "karaj" },
                  { label: "اصفهان", value: "isfahan" },
                ]}
              />
              <Combobox
                label="جستجو و انتخاب مهارت"
                options={[
                  { label: "انبارداری و بسته‌بندی", value: "anbar" },
                  { label: "فروشندگی و صندوق‌داری", value: "sales" },
                  { label: "پیک موتوری", value: "peyk" },
                ]}
                value={comboboxValue}
                onChange={setComboboxValue}
              />
            </div>
            <Textarea label="توضیحات تکمیلی شیفت" placeholder="متن کامل متقاضی..." />
            <div className="flex items-center gap-6 pt-2">
              <Checkbox checked={checkboxState} onChange={setCheckboxState} label="پذیرش قوانین و مقررات کارآن" />
              <Switch checked={switchState} onChange={setSwitchState} label="اعلام وضعیت آنلاین GPS" />
            </div>
          </section>

          {/* Modals & Dialogs Section */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">پنجره‌های شناور (Modals & BottomSheets)</h3>
            <div className="flex gap-3">
              <Button onClick={() => setDialogOpen(true)}>نمایش Dialog استاندارد</Button>
              <Button variant="outline" onClick={() => setBottomSheetOpen(true)}>
                نمایش BottomSheet موبایل
              </Button>
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="تایید نهایی شیفت">
              <p className="text-xs text-muted-foreground">آیا از انتشار این شیفت و قفل سپرده اطمینان دارید؟</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" onClick={() => setDialogOpen(false)}>
                  تایید
                </Button>
              </div>
            </Dialog>

            <BottomSheet isOpen={bottomSheetOpen} onClose={() => setBottomSheetOpen(false)} title="اکشن‌های شیفت فعال">
              <p className="text-xs text-muted-foreground">عملیات مربوط به ورود و استراحت را انتخاب کنید.</p>
            </BottomSheet>
          </section>
        </div>
      )}

      {activeTab === "DOMAIN" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="کل شیفت‌های امروز" value="۱۲۸" icon={<MapPin className="w-5 h-5" />} trend="+۱۲٪ رشد" />
            <StatCard title="کارجویان آنلاین" value="۴۵۰" icon={<User className="w-5 h-5" />} trend="+۵٪ امروز" />
            <StatCard title="مجموع تسویه‌های موفق" value="۱,۲۵۰,۰۰۰,۰۰۰ تومان" icon={<Check className="w-5 h-5" />} />
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">بج‌ها و نمایشگرهای اختصاصی</h3>
            <div className="flex flex-wrap items-center gap-4">
              <StatusBadge status="PUBLISHED" />
              <StatusBadge status="CHECKED_IN" />
              <StatusBadge status="ON_BREAK" />
              <StatusBadge status="SETTLED" />
              <StatusBadge status="CANCELLED" />
              <ReliabilityBadge score={99.2} />
              <RatingStars score={4} />
              <Avatar name="علی رضایی" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "FEEDBACK" && (
        <div className="space-y-8">
          <EmptyState title="هیچ شیفتی یافت نشد" description="می‌توانید شیفت کاری جدیدی ایجاد کنید." />
          <ErrorState message="خطا در برقراری ارتباط با سرور" onRetry={() => {}} />

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground">اسکلتون بارگذاری (Skeleton)</h4>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>

          <DataTableShell headers={["شناسه", "عنوان شیفت", "مبلغ (ریال)", "وضعیت"]}>
            <tr>
              <td className="px-5 py-3.5">shf_101</td>
              <td className="px-5 py-3.5 font-bold">انبارداری فروشگاه</td>
              <td className="px-5 py-3.5">
                <CurrencyDisplay amountRials={BigInt(15000000)} />
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status="PUBLISHED" />
              </td>
            </tr>
          </DataTableShell>

          <Pagination currentPage={currentPage} totalPages={5} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
