import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "IDEMPOTENCY_KEY_REUSED"
  | "INSUFFICIENT_FUNDS"
  | "PAYMENT_PROVIDER_ERROR"
  | "INVALID_STATE_TRANSITION"
  | "INVALID_ASSIGNMENT_STATE"
  | "CANCELLATION_NOT_ALLOWED"
  | "CANCELLATION_ALREADY_RECORDED"
  | "INVALID_CANCELLATION_REASON"
  | "GEOFENCE_VIOLATION"
  | "OUTSIDE_GEOFENCE"
  | "LOW_LOCATION_ACCURACY"
  | "LOCATION_UNAVAILABLE"
  | "PRESENCE_UNAVAILABLE"
  | "MISSING_CHECK_IN"
  | "CHECK_OUT_FAILED"
  | "QR_INVALID"
  | "QR_EXPIRED"
  | "QR_WRONG_PURPOSE"
  | "QR_WRONG_BRANCH"
  | "ATTENDANCE_CODE_INVALID"
  | "ATTENDANCE_CODE_EXPIRED"
  | "CHECK_IN_TOO_EARLY"
  | "CHECK_IN_TOO_LATE"
  | "ALREADY_CHECKED_IN"
  | "ALREADY_CHECKED_OUT"
  | "ACTIVE_BREAK_EXISTS"
  | "CAMERA_PERMISSION_REQUIRED"
  | "RATE_LIMITED"
  | "EXPIRED_OTP"
  | "MAX_ATTEMPTS_EXCEEDED"
  | "INVALID_OTP"
  | "ACCOUNT_BLOCKED"
  | "DEMO_ACCESS_DISABLED"
  | "INVALID_DEMO_ROLE"
  | "DEMO_ACCOUNT_ROLE_CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = "BAD_REQUEST",
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse<StandardApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function createErrorResponse(error: unknown): NextResponse<StandardApiResponse> {
  console.error("[API Error]", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const formattedDetails: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const field = err.path.join(".") || "form";
      if (!formattedDetails[field]) formattedDetails[field] = [];
      formattedDetails[field].push(err.message);
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "اطلاعات وارد شده معتبر نمی‌باشد.",
          details: formattedDetails as unknown as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 422 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "خطای غیرمنتظره‌ای در سرور رخ داد.",
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}
