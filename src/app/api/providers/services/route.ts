import { NextRequest } from "next/server";
import { userRegistry } from "@/lib/user-registry";
import { createSuccessResponse, createErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const services = await userRegistry.getAllOfferedServices();
    return createSuccessResponse({
      items: services,
      total: services.length,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.phone) {
      return createErrorResponse(new Error("عنوان خدمت و شماره تلفن الزامی است."));
    }

    const service = await userRegistry.registerProviderService({
      providerId: body.providerId,
      phone: body.phone,
      fullName: body.fullName,
      title: body.title,
      category: body.category || "سایر",
      rate: body.rate || "توافقی",
      city: body.city || "تهران",
      address: body.address,
      latitude: body.latitude ? Number(body.latitude) : undefined,
      longitude: body.longitude ? Number(body.longitude) : undefined,
      details: body.details,
    });

    return createSuccessResponse(service);
  } catch (error) {
    return createErrorResponse(error);
  }
}
