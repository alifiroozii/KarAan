import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { userRegistry } from "@/lib/user-registry";

const createRequestSchema = z.object({
  userId: z.string().max(100).optional(),
  userEmail: z.string().max(100).optional(),
  userPhone: z.string().max(30).optional(),
  fullName: z.string().max(150).optional(),
  role: z.string().max(50).optional(),
  title: z.string().min(2, "عنوان باید حداقل ۲ حرف باشد").max(200),
  category: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  details: z.string().max(2000).optional(),
  deviceModel: z.string().max(200).optional(),
  platform: z.enum(["ANDROID", "WEB", "IOS"]).optional(),
});

export async function GET() {
  try {
    const usersResult = await userRegistry.listUsers({ limit: 100 });
    const allRequests: Array<{
      requestId: string;
      title: string;
      category: string;
      budget: string;
      city: string;
      address?: string;
      status: string;
      createdAt: string;
      updatedAt?: string;
      approvedAt?: string;
      details?: string;
      user: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        role: string;
        platform: string;
        deviceModel: string;
      };
    }> = [];

    for (const u of usersResult.items) {
      if (u.submittedRequests && u.submittedRequests.length > 0) {
        for (const req of u.submittedRequests) {
          allRequests.push({
            requestId: req.id,
            title: req.title,
            category: req.category,
            budget: req.budget,
            city: req.city,
            address: req.address,
            status: req.status,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            approvedAt: req.approvedAt,
            details: req.details,
            user: {
              id: u.id,
              fullName: u.fullName,
              phone: u.phone,
              email: u.email,
              role: u.role,
              platform: u.platform,
              deviceModel: u.deviceModel,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        items: allRequests,
        total: allRequests.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json(
      { success: false, error: { message: "خطا در دریافت لیست درخواست‌ها" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { success: false, error: { message: "داده‌های ورودی نامعتبر است." } },
        { status: 400 }
      );
    }

    const parseResult = createRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "اعتبارسنجی ورودی ناموفق بود.";
      return NextResponse.json(
        { success: false, error: { message: errorMsg, details: parseResult.error.format() } },
        { status: 400 }
      );
    }

    const {
      userId,
      userEmail,
      userPhone,
      fullName,
      role,
      title,
      category,
      budget,
      city,
      address,
      details,
      deviceModel,
      platform,
    } = parseResult.data;

    // Find or create the user in the registry
    let targetUser = await userRegistry.findUser({
      id: userId,
      email: userEmail,
      phone: userPhone,
    });

    if (!targetUser) {
      if (userPhone && userPhone.trim()) {
        const reg = await userRegistry.registerOrLoginPhone({
          phone: userPhone.trim(),
          fullName: fullName?.trim() || `کاربر ${userPhone.trim()}`,
          role: role === "WORKER" ? "WORKER" : "EMPLOYER",
          platform: platform || "ANDROID",
          deviceModel: deviceModel || "Google Pixel / Android App",
          city: city || "تهران",
        });
        targetUser = reg.user;
      } else {
        const reg = await userRegistry.registerOrLoginGmail({
          email: userEmail || `mobile_${Date.now()}@karaan.ir`,
          fullName: fullName || "کاربر همراه کاروین",
          role: role === "WORKER" ? "WORKER" : "EMPLOYER",
          phone: `0912${Math.floor(1000000 + Math.random() * 9000000)}`,
          platform: platform || "ANDROID",
          deviceModel: deviceModel || "Google Pixel / Android Emulator",
          city: city || "تهران",
        });
        targetUser = reg.user;
      }
    }

    const created = await userRegistry.submitUserRequest(targetUser.id, {
      title,
      category: category || "فنی و تخصصی",
      budget: budget || "توافقی",
      city: city || targetUser.city || "تهران",
      address,
      details,
    });

    // Auto-record in telemetry audit logs
    try {
      await userRegistry.recordTelemetryLog({
        userId: targetUser.id,
        actorName: targetUser.fullName,
        phone: targetUser.phone,
        role: targetUser.role,
        action: "ORDER_SUBMITTED",
        entityName: "service_request",
        entityId: created?.id || "req_direct",
        details: {
          title,
          category: category || "فنی و تخصصی",
          budget: budget || "توافقی",
          city: city || targetUser.city || "تهران",
          address: address || "تهران",
          event: "ثبت مستقیم درخواست کار و انتشار بدون معطلی روی نقشه",
        },
      });
    } catch (e) {
      console.warn("Telemetry log record warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: "درخواست کار با موفقیت ثبت شد و به پنل مدیریت ارسال گردید.",
      data: {
        request: created,
        user: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          phone: targetUser.phone,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Failed to submit request:", error);
    return NextResponse.json(
      { success: false, error: { message: "خطا در ثبت درخواست کار" } },
      { status: 500 }
    );
  }
}
