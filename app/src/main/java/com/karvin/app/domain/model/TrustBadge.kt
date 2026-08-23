package com.karvin.app.domain.model

enum class TrustBadgeType {
    IDENTITY_VERIFIED,     // ✅ تایید هویت کاروین
    TOP_COMPLETED_JOBS,    // ✅ ۱۰۰+ کار موفق
    PUNCTUAL_ATTENDANCE,   // ✅ حضور منظم و به موقع
    INSURED_WORKER,        // ✅ دارای بیمه حوادث
    TOP_RATED              // ✅ نیروی برگزیده (امتیاز بالای ۴.۸)
}

data class TrustBadge(
    val type: TrustBadgeType,
    val titleFa: String,
    val descriptionFa: String,
    val iconName: String = "verified"
) {
    companion object {
        val BADGE_IDENTITY = TrustBadge(
            type = TrustBadgeType.IDENTITY_VERIFIED,
            titleFa = "تایید هویت کاروین",
            descriptionFa = "مدارک هویتی و سوءپیشینه بررسی و تایید شده است."
        )

        val BADGE_100_JOBS = TrustBadge(
            type = TrustBadgeType.TOP_COMPLETED_JOBS,
            titleFa = "۱۰۰+ کار موفق",
            descriptionFa = "بیش از ۱۰۰ شیفت و پروژه موفق با رضایت کارفرما انجام شده است."
        )

        val BADGE_PUNCTUAL = TrustBadge(
            type = TrustBadgeType.PUNCTUAL_ATTENDANCE,
            titleFa = "حضور منظم و دقیق",
            descriptionFa = "نرخ حضور به موقع بالای ۹۸٪ در شیفت‌های ثبت شده."
        )

        val BADGE_TOP_RATED = TrustBadge(
            type = TrustBadgeType.TOP_RATED,
            titleFa = "نیروی برگزیده",
            descriptionFa = "میانگین امتیاز بالای ۴.۸ از کارفرمایان مختلف."
        )
    }
}
