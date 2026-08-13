export const APP_CONFIG = {
  name: "کارآن",
  description: "پلتفرم هوشمند نیروی کار ساعتی و شیفتی در ایران",
  defaultLocale: "fa",
  defaultDir: "rtl",
  currency: "ریال",
  otpLength: 5,
  defaultGeofenceRadiusMeters: 100,
  maxRadialSearchKm: 25,
} as const;

export const USER_ROLES = {
  WORKER: "WORKER",
  EMPLOYER: "EMPLOYER",
  ADMIN: "ADMIN",
} as const;
