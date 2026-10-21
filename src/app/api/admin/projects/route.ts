import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { userRegistry, UserSubmittedRequest, RegisteredUser } from "@/lib/user-registry";

export interface ProjectWithUser extends UserSubmittedRequest {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    platform: string;
    deviceModel: string;
    isVerified: boolean;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "admin.audit.view");
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q")?.toLowerCase() || "";
    const status = searchParams.get("status") || "ALL";
    const category = searchParams.get("category") || "ALL";

    const { items: allUsers } = await userRegistry.listUsers({ limit: 1000 });
    const projects: ProjectWithUser[] = [];

    for (const u of allUsers) {
      if (u.submittedRequests && u.submittedRequests.length > 0) {
        for (const reqItem of u.submittedRequests) {
          // Filter by status
          if (status !== "ALL" && reqItem.status !== status) continue;

          // Filter by category
          if (category !== "ALL" && reqItem.category !== category) continue;

          // Filter by search query
          if (
            query &&
            !reqItem.title.toLowerCase().includes(query) &&
            !reqItem.category.toLowerCase().includes(query) &&
            !reqItem.city.toLowerCase().includes(query) &&
            !u.fullName.toLowerCase().includes(query) &&
            !u.phone.includes(query)
          ) {
            continue;
          }

          projects.push({
            ...reqItem,
            user: {
              id: u.id,
              fullName: u.fullName,
              phone: u.phone,
              email: u.email,
              platform: u.platform,
              deviceModel: u.deviceModel,
              isVerified: u.isVerified,
            },
          });
        }
      }
    }

    // Sort newest first
    projects.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Compute metrics
    const totalProjects = projects.length;
    const pendingReview = projects.filter((p) => p.status === "ACTIVE").length;
    const approvedAndMatching = projects.filter(
      (p) => p.status === "APPROVED" || p.status === "ACCEPTED"
    ).length;
    const inProgress = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;

    // Calculate total escrow capital protected (parsing numbers from budget strings)
    let totalEscrowToman = 0;
    for (const p of projects) {
      const numeric = parseInt(p.budget.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(numeric)) {
        totalEscrowToman += numeric;
      }
    }

    return createSuccessResponse({
      projects,
      metrics: {
        totalProjects,
        pendingReview,
        approvedAndMatching,
        inProgress,
        completed,
        totalEscrowToman,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

const createProjectSchema = z.object({
  title: z.string().min(2, "عنوان پروژه الزامی است"),
  category: z.string().min(2, "دسته‌بندی الزامی است"),
  budget: z.string().min(2, "بودجه الزامی است"),
  city: z.string().optional(),
  address: z.string().optional(),
  details: z.string().optional(),
  requesterName: z.string().optional(),
  requesterPhone: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "admin.users.manage");
    const body = await req.json();
    const parsed = createProjectSchema.parse(body);

    let targetUserId = parsed.userId;

    if (!targetUserId) {
      if (parsed.requesterPhone) {
        const found = await userRegistry.findUser({ phone: parsed.requesterPhone });
        if (found) targetUserId = found.id;
      }

      if (!targetUserId) {
        const phone = parsed.requesterPhone || `0912${Math.floor(1000000 + Math.random() * 9000000)}`;
        const reg = await userRegistry.registerOrLoginGmail({
          email: `client_${Date.now()}@karaan.ir`,
          fullName: parsed.requesterName || "کارفرمای متقاضی کارجور",
          phone,
          role: "EMPLOYER",
          platform: "WEB",
          city: parsed.city || "تهران",
        });
        targetUserId = reg.user.id;
      }
    }

    const newProject = await userRegistry.submitUserRequest(targetUserId, {
      title: parsed.title,
      category: parsed.category,
      budget: parsed.budget,
      city: parsed.city,
      address: parsed.address,
      details: parsed.details,
    });

    if (!newProject) {
      return createErrorResponse(new Error("خطا در ایجاد و ثبت پروژه جدید."));
    }

    return createSuccessResponse({
      project: newProject,
      message: "پروژه و سفارش جدید با موفقیت در سامانه کارجور ثبت شد.",
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
