import { z } from "zod";

export const createShiftSchema = z.object({
  title: z.string().min(3, "عنوان شیفت باید حداقل ۳ کاراکتر باشد"),
  description: z.string().optional(),
  locationName: z.string().min(2, "نام مکان الزامی است"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().min(20).max(5000).default(100),
  requiredSkills: z.array(z.string()).default([]),
  hourlyPayRials: z.number().positive("دستمزد ساعتی باید مثبت باشد"),
  totalBudgetRials: z.number().positive("بودجه کل باید مثبت باشد"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  idempotencyKey: z.string().min(5),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
