package com.karvin.app.data

import com.karvin.app.domain.model.Category
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.NearbyProvider
import com.karvin.app.domain.model.NearbyServiceRequest

/**
 * Fake data generator for the map-first demo.
 * Providers and requests are generated deterministically based on a seed point.
 * Results are stable within a session — they don't change on recomposition.
 */
object FakeNearbyData {

    private val center = GeoPoint(35.7219, 51.3347)

    private val providerCategories = listOf(
        Category("electrician", "برقکار", "برق"),
        Category("plumber", "لوله‌کش", "آب"),
        Category("painter", "نقاش ساختمان", "رنگ"),
        Category("repair", "تعمیرکار", "تعمیر"),
        Category("cleaning", "نظافت", "خانه"),
        Category("mason", "بنا", "ساخت"),
        Category("driver", "راننده", "رانندگی"),
        Category("services", "خدمات", "خدمت"),
    )

    private val requestCategories = listOf(
        Category("electrician", "برقکاری", "برق"),
        Category("plumber", "لوله‌کشی", "آب"),
        Category("painter", "نقاشی", "رنگ"),
        Category("repair", "تعمیرات", "تعمیر"),
        Category("cleaning", "نظافت", "خانه"),
        Category("mason", "بنایی", "ساخت"),
        Category("services", "خدمات", "خدمت"),
    )

    private val providerNames = listOf(
        "محمد رضایی", "علی مرادی", "رضا احمدی", "حسین کریمی",
        "مهدی محمدی", "امیر حسینی", "سعید اکبری", "نگار صادقی",
        "سارا جعفری", "مریم نوروزی", "فاطمه طاهری", "زهرا حیدری",
        "پویان اکبری", "کیانا رضایی", "امیر کاظمی", "شهاب نوری",
        "میلاد احمدی", "فرشاد حسینی", "احسان مرادی", "بهزاد کریمی",
        "آتنا رضایی", "لیلا محمدی", "نوید صادقی", "مرضیه جعفری",
    )

    private val providerSkills = mapOf(
        "برقکار" to listOf("رفع اتصالی", "نصب لوستر", "سیم‌کشی", "نصب آیفون", "تعمیر کلید"),
        "لوله‌کش" to listOf("رفع نشتی", "نصب شیرآلات", "تعمیر سینک", "لوله‌کشی ساختمان"),
        "نقاش ساختمان" to listOf("رنگ‌آمیزی دیوار", "بتونه‌کاری", "نقاشی سقف", "کاغذ دیواری"),
        "تعمیرکار" to listOf("تعمیر لوازم خانگی", "تعمیر موبایل", "تعمیر کامپیوتر", "نصاب دوربین"),
        "نظافت" to listOf("نظافت منزل", "نظافت محل کار", "نظافت بعد از ساخت"),
        "بنا" to listOf("کاشی‌کاری", "سنگ‌کاری", "ساخت دیوار", "تخریب"),
        "راننده" to listOf("باربری", "اسباب‌کشی", "تحویل سفارش"),
        "خدمات" to listOf("نصاب کولر", "نجار", "جوشکار", "عکاس"),
    )

    private val requestTitles = listOf(
        "نصب لوستر", "رفع نشتی سینک", "سرویس کولر", "نصاب دوربین مداربسته",
        "رنگ‌آمیزی اتاق", "تعمیر شیر آب", "نظافت واحد اداری", "چیدمان انبار",
        "کمک در اسباب‌کشی", "سیم‌کشی ساختمان", "هرس درختان", "تعمیر لوازم خانگی",
        "نصب آیفون تصویری", "کاشی‌کاری حمام", "نجاری درب", "تعمیر موبایل",
    )

    private val requestDescriptions = listOf(
        "نصب دو عدد لوستر در پذیرایی و اتاق خواب. سیم‌کشی آماده است.",
        "نشتی زیر سینک آشپزخانه. لوله‌کشی PVC نیاز به تعویض دارد.",
        "سرویس و شارژ گاز کولر اسپلیت. مدل سامسونگ ۲۰۲۳.",
        "نصب ۴ دوربین مداربسته در حیاط و پارکینگ.",
        "رنگ‌آمیزی اتاق خواب به مساحت ۱۵ متر مربع.",
        "تعمیر شیر اهرمی حمام که چکه می‌کند.",
        "نظافت کامل واحد اداری ۱۲۰ متری.",
        "چیدمان و مرتب‌سازی انبار کوچک.",
        "اسباب‌کشی از ولنجک به سعادت‌آباد.",
        "سیم‌کشی برق برای ۶ پریز جدید.",
        "هرس ۳ درخت باغچه.",
        "تعمیر ماشین لباسشویی ال‌جی.",
        "نصب آیفون تصویری برای درب ورودی.",
        "کاشی‌کاری کف حمام ۸ متری.",
        "ساخت درب چوبی اتاق.",
        "تعمیر گوشی آیفون ۱۵ - صفحه شکسته.",
    )

    private val requesterNames = listOf(
        "رضا محمدی", "امیر کاظمی", "حسین احمدی", "مهدی رضایی",
        "علی نوری", "سعید مرادی", "پویان صادقی", "فرهاد جعفری",
        "امیر حسینی", "بهزاد نوروزی", "میلاد طاهری", "احسان کریمی",
    )

    private val addresses = listOf(
        "تهران، سعادت‌آباد", "تهران، ولنجک", "تهران، ونک", "تهران، جردن",
        "تهران، شهرک غرب", "تهران، پاسداران", "تهران، نیاوران", "تهران، صادقیه",
        "تهران، ستارخان", "تهران، امیرآباد", "تهران، تهرانپارس", "تهران، یوسف‌آباد",
    )

    /** Return the source category id for a generated provider. */
    fun categoryIdForProvider(provider: NearbyProvider): String? =
        providerCategories.firstOrNull { it.title == provider.primarySkill }?.id

    /**
     * Generate stable fake providers around the given center point.
     * The same center always produces the same list.
     */
    fun generateProviders(center: GeoPoint = this.center): List<NearbyProvider> {
        val distances = listOf(
            0.003, 0.006, 0.010, 0.016, 0.022, 0.032, 0.045,
            0.004, 0.008, 0.013, 0.020, 0.028, 0.038, 0.050,
            0.005, 0.009, 0.015, 0.025, 0.035, 0.042, 0.055,
            0.002, 0.007, 0.011,
        )
        return providerNames.mapIndexed { index, name ->
            val cat = providerCategories[index % providerCategories.size]
            val skillPool = providerSkills[cat.title].orEmpty()
            val latOffset = ((index * 17) % 19 - 9) * distances[index % distances.size]
            val lonOffset = ((index * 11) % 19 - 9) * distances[index % distances.size]
            val distMeters = distances[index % distances.size] * 111_000
            NearbyProvider(
                id = "provider-${index + 1}",
                name = name,
                primarySkill = cat.title,
                skills = skillPool.take(4),
                point = GeoPoint(center.latitude + latOffset, center.longitude + lonOffset),
                rating = 4.2 + (index % 8) * 0.1,
                reviewCount = 15 + index * 7,
                completedJobs = 30 + index * 12,
                isAvailable = index % 4 != 0,
                isVerified = index % 5 != 0,
                basePrice = 350_000L + (index % 8) * 150_000L,
                shortBio = "متخصص ${cat.title} با بیش از ${3 + index % 5} سال تجربه.",
                responseTime = listOf("۱۵ دقیقه", "۳۰ دقیقه", "۱ ساعت", "۲ ساعت")[index % 4],
                portfolioItems = skillPool.take(3),
                services = skillPool.take(2),
            )
        }
    }

    /**
     * Generate stable fake service requests around the given center point.
     */
    fun generateRequests(center: GeoPoint = this.center): List<NearbyServiceRequest> {
        val distances = listOf(
            0.004, 0.008, 0.012, 0.018, 0.025, 0.035, 0.050,
            0.005, 0.010, 0.015, 0.022, 0.030, 0.040, 0.055,
            0.006, 0.009,
        )
        val budgets = listOf(
            450_000L, 300_000L, 850_000L, 2_500_000L, 0L,
            600_000L, 0L, 200_000L, 1_200_000L, 750_000L,
            0L, 1_500_000L, 900_000L, 400_000L, 0L, 550_000L,
        )
        val times = listOf(
            "امروز، بعدازظهر", "فردا صبح", "امروز، عصر", "فردا بعدازظهر",
            "پس‌فردا", "امروز، صبح", "فردا عصر", "هفته آینده",
            "امروز، بعدازظهر", "فردا صبح", "امروز، عصر", "پس‌فردا",
            "فردا بعدازظهر", "امروز، صبح", "هفته آینده", "فردا عصر",
        )
        return requestTitles.mapIndexed { index, title ->
            val cat = requestCategories[index % requestCategories.size]
            val latOffset = ((index * 13) % 17 - 8) * distances[index % distances.size]
            val lonOffset = ((index * 9) % 17 - 8) * distances[index % distances.size]
            val budget = budgets[index % budgets.size]
            NearbyServiceRequest(
                id = "request-${index + 1}",
                title = title,
                category = cat,
                description = requestDescriptions[index % requestDescriptions.size],
                budget = budget,
                budgetLabel = if (budget == 0L) "توافقی" else "${budget / 1000}٬${String.format("%03d", budget % 1000)} تومان",
                point = GeoPoint(center.latitude + latOffset, center.longitude + lonOffset),
                createdAt = listOf("۱۰ دقیقه پیش", "۳۰ دقیقه پیش", "۱ ساعت پیش", "۲ ساعت پیش", "۳ ساعت پیش")[index % 5],
                isUrgent = index % 5 == 0,
                requesterRating = 4.0 + (index % 6) * 0.15,
                scheduledTime = times[index % times.size],
                approximateAddress = addresses[index % addresses.size],
                requesterName = requesterNames[index % requesterNames.size],
            )
        }
    }
}
