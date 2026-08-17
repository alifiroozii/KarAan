import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { PaymentService } from "@/modules/payments/payment.service";
import { createErrorResponse } from "@/lib/errors";
import { formatMoneyRials } from "@/lib/money";

const paymentService = new PaymentService();

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const authority = url.searchParams.get("authority") ?? "";
    const result = url.searchParams.get("result");
    const payment = await paymentService.getMockGatewayPayment(authority);

    if (result === "success" || result === "cancel") {
      const callback = new URL(env.PAYMENT_CALLBACK_URL);
      callback.searchParams.set("paymentId", payment.paymentId);
      callback.searchParams.set("provider", "MOCK");
      callback.searchParams.set("Authority", authority);
      callback.searchParams.set("Status", result === "success" ? "OK" : "NOK");
      return NextResponse.redirect(callback, 303);
    }

    const successUrl = new URL(req.url);
    successUrl.searchParams.set("result", "success");
    const cancelUrl = new URL(req.url);
    cancelUrl.searchParams.set("result", "cancel");

    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>درگاه آزمایشی کارآن</title></head>
<body style="font-family:system-ui;background:#0b1020;color:#fff;margin:0;display:grid;place-items:center;min-height:100vh">
  <main style="width:min(92vw,480px);background:#151b2e;border:1px solid #293047;border-radius:24px;padding:28px;box-sizing:border-box">
    <h1 style="margin-top:0;font-size:22px">درگاه آزمایشی کارآن</h1>
    <p style="color:#aeb8d0">این صفحه فقط برای Development/Test است و هیچ تراکنش بانکی واقعی انجام نمی‌دهد.</p>
    <div style="padding:16px;background:#0f1527;border-radius:16px;margin:18px 0">
      <div>مبلغ: <strong>${escapeHtml(formatMoneyRials(BigInt(payment.amountRials), "TOMAN"))}</strong></div>
      <div style="margin-top:8px">شرح: ${escapeHtml(payment.description)}</div>
    </div>
    <a href="${escapeHtml(successUrl.toString())}" style="display:block;text-align:center;padding:13px;border-radius:12px;background:#22c55e;color:#07110a;text-decoration:none;font-weight:700">پرداخت موفق آزمایشی</a>
    <a href="${escapeHtml(cancelUrl.toString())}" style="display:block;text-align:center;padding:13px;border-radius:12px;background:#31394f;color:#fff;text-decoration:none;font-weight:700;margin-top:10px">لغو پرداخت</a>
  </main>
</body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
