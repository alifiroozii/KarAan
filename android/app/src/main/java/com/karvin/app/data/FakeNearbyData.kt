package com.karvin.app.data

import com.karvin.app.domain.model.Category
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.NearbyProvider
import com.karvin.app.domain.model.NearbyServiceRequest
import com.karvin.app.domain.model.toPersianDigits

/**
 * Fake data generator for the map-first demo.
 * Providers and requests are generated deterministically based on a seed point.
 * Results are stable within a session — they don't change on recomposition.
 */
object FakeNearbyData {

    private val center = GeoPoint(35.7730, 51.3700) // سعادت‌آباد تهران (مطابق طراحی استیچ)

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
        "مهندس رضا اکبری", "امیر مرادی", "رضا احمدی", "حسین کریمی",
        "مهدی محمدی", "فرشاد حسینی", "سعید اکبری", "نگار صادقی",
        "سارا جعفری", "مریم نوروزی", "فاطمه طاهری", "زهرا حیدری",
        "پویان اکبری", "کیانا رضایی", "امیر کاظمی", "شهاب نوری",
        "میلاد احمدی", "علی رضایی", "احسان مرادی", "بهزاد کریمی",
        "آتنا رضایی", "لیلا محمدی", "نوید صادقی", "مرضیه جعفری",
    )

    private val providerSkills = mapOf(
        "برقکار" to listOf("سیم‌کشی و اتصالی", "نصب لوستر", "کابل‌کشی سانترال", "نصب آیفون", "تعمیر کلید"),
        "لوله‌کش" to listOf("رفع نشتی", "نصب شیرآلات", "تعمیر پکیج و رادیاتور", "لوله‌کشی ساختمان"),
        "نقاش ساختمان" to listOf("رنگ‌آمیزی دیوار", "بتونه‌کاری", "نقاشی سقف", "کاغذ دیواری"),
        "تعمیرکار" to listOf("سرویس و تعمیر پکیج", "تعمیر لوازم خانگی", "نصاب دوربین مداربسته", "تعمیر کولر"),
        "نظافت" to listOf("نظافت منزل", "نظافت محل کار", "نظافت راه پله و مشاعات"),
        "بنا" to listOf("کاشی‌کاری", "سنگ‌کاری", "بازسازی سرویس بهداشتی"),
        "راننده" to listOf("باربری وانت", "اسباب‌کشی", "تحویل سریع بسته"),
        "خدمات" to listOf("نصاب کولر ۲۴ هزار", "نجار و درب", "جوشکاری سیار"),
    )

    private val requestTitles = listOf(
        "نصب کولر ۲۴ هزار", "تعمیر جعبه فیوز", "سرویس و تعمیر پکیج", "نصاب دوربین مداربسته",
        "رنگ‌آمیزی اتاق خواب", "رفع نشتی و تعمیر شیر", "نظافت واحد اداری", "چیدمان انبار",
        "کمک در اسباب‌کشی", "سیم‌کشی ساختمان", "هرس درختان باغچه", "تعمیر لوازم خانگی",
        "نصب آیفون تصویری", "کاشی‌کاری حمام", "نجاری درب اتاق", "کابل‌کشی سانترال",
    )

    private val requestDescriptions = listOf(
        "نصب کولر گازی ۲۴۰۰۰ در بالکن طبقه سوم. لوله‌کشی مسی موجود است.",
        "تعمیر جعبه فیوز و اتصالی برق ورودی ساختمان. نیاز به بررسی فوری.",
        "سرویس دوره‌ای پکیج ایران رادیاتور و هواگیری کامل رادیاتورها.",
        "نصب ۴ عدد دوربین مداربسته دید در شب برای پارکینگ و درب ورودی.",
        "رنگ‌آمیزی روغنی اتاق خواب به مساحت ۱۸ متر مربع.",
        "چکه کردن شیر اهرمی زیر سینک ظرفشویی و تعویض کارتریج.",
        "نظافت کامل و جاروکشی واحد اداری ۱۴۰ متری سعادت‌آباد.",
        "چیدمان و مرتب‌سازی انبار قطعات و بسته‌بندی جعبه‌ها.",
        "کمک در بارگیری و تخلیه اثاثیه منزل از سعادت‌آباد به شهرک غرب.",
        "سیم‌کشی کامل ۶ پریز برق جدید و کلید روشنایی پذیرایی.",
        "هرس شاخه‌های خشک ۴ اصله درخت حیاط و جمع‌آوری ضایعات.",
        "تعمیر ماشین لباسشویی بوش به دلیل عدم تخلیه آب.",
        "نصب مانیتور آیفون تصویری سیماران و اتصال به پنل دم در.",
        "تعویض کاشی‌های آسیب‌دیده کف حمام به مساحت ۶ متر مربع.",
        "رگلاژ و تعمیر لولای درب چوبی اتاق خواب.",
        "کابل‌کشی شبکه و سانترال برای ۸ ایستگاه کاری شرکت.",
    )

    private val requesterNames = listOf(
        "فرهاد جعفری", "رضا محمدی", "امیر کاظمی", "حسین احمدی",
        "مهدی رضایی", "علی نوری", "سعید مرادی", "پویان صادقی",
        "امیر حسینی", "بهزاد نوروزی", "میلاد طاهری", "احسان کریمی",
    )

    private val addresses = listOf(
        "تهران، سعادت‌آباد، بلوار دریا", "تهران، سعادت‌آباد، میدان کاج", "تهران، شهرک غرب، فاز ۱", "تهران، شهرک غرب، دادمان",
        "تهران، بلوار پاک‌نژاد", "تهران، بلوار فرحزادی", "تهران، پونک، سردار جنگل", "تهران، صادقیه، خسرو",
        "تهران، ستارخان، شادمان", "تهران، گیشا، کوی نصر", "تهران، میدان ونک، ملاصدرا", "تهران، جردن، آفریقا",
    )

    /** Return the source category id for a generated provider. */
    fun categoryIdForProvider(provider: NearbyProvider): String? =
        providerCategories.firstOrNull { it.title == provider.primarySkill }?.id

    /**
     * Generate stable fake providers around the given center point.
     * Well-spaced across realistic street coordinates (0.4km to 3.8km).
     */
    fun generateProviders(center: GeoPoint = this.center): List<NearbyProvider> {
        val angles = listOf(
            0.15, 0.65, 1.25, 1.85, 2.45, 3.05, 3.65, 4.25, 4.85, 5.45,
            0.40, 0.95, 1.55, 2.15, 2.75, 3.35, 3.95, 4.55, 5.15, 5.80,
            0.75, 1.40, 2.05, 2.70
        )
        val radiiKm = listOf(
            0.6, 1.2, 1.8, 2.6, 0.9, 1.5, 2.2, 3.1, 0.7, 1.4,
            2.0, 2.9, 1.1, 1.7, 2.4, 3.5, 0.8, 1.6, 2.3, 3.3,
            1.0, 1.9, 2.7, 3.8
        )
        return providerNames.mapIndexed { index, name ->
            val cat = providerCategories[index % providerCategories.size]
            val skillPool = providerSkills[cat.title].orEmpty()
            val rKm = radiiKm[index % radiiKm.size]
            val angle = angles[index % angles.size]
            val latOffset = (rKm * kotlin.math.sin(angle)) / 111.0
            val lonOffset = (rKm * kotlin.math.cos(angle)) / 90.0
            val rating = Math.round((4.4 + (index % 6) * 0.1) * 10.0) / 10.0
            NearbyProvider(
                id = "provider-${index + 1}",
                name = name,
                primarySkill = cat.title,
                skills = skillPool.take(4),
                point = GeoPoint(center.latitude + latOffset, center.longitude + lonOffset),
                rating = rating,
                reviewCount = 28 + index * 9,
                completedJobs = 45 + index * 14,
                isAvailable = index % 5 != 0,
                isVerified = index % 3 == 0 || index == 0,
                basePrice = 250_000L + (index % 6) * 75_000L,
                shortBio = "متخصص ${cat.title} با بیش از ${4 + index % 6} سال سابقه کاری رسمی و تایید اتحادیه.",
                responseTime = listOf("۱۵ دقیقه", "۲۵ دقیقه", "۴۵ دقیقه", "۱ ساعت")[index % 4],
                portfolioItems = skillPool.take(3),
                services = skillPool.take(2),
            )
        }
    }

    /**
     * Generate stable fake service requests around the given center point.
     * Well-spaced across realistic street coordinates (0.5km to 3.5km).
     */
    fun generateRequests(center: GeoPoint = this.center): List<NearbyServiceRequest> {
        val angles = listOf(
            0.35, 0.85, 1.45, 2.05, 2.65, 3.25, 3.85, 4.45,
            5.05, 5.65, 0.55, 1.15, 1.75, 2.35, 2.95, 3.55
        )
        val radiiKm = listOf(
            0.8, 1.4, 2.1, 2.8, 0.7, 1.3, 1.9, 2.7,
            1.0, 1.6, 2.4, 3.2, 0.9, 1.5, 2.2, 3.0
        )
        val budgets = listOf(
            850_000L, 350_000L, 450_000L, 2_500_000L, 1_200_000L,
            600_000L, 250_000L, 750_000L, 1_000_000L, 400_000L,
            950_000L, 550_000L, 1_500_000L, 800_000L, 500_000L, 650_000L,
        )
        val times = listOf(
            "امروز، بعدازظهر", "همین الان (فوری)", "امروز، عصر", "فردا صبح",
            "فردا بعدازظهر", "امروز، بعدازظهر", "فردا عصر", "هفته آینده",
            "امروز، عصر", "همین الان (فوری)", "فردا صبح", "امروز، بعدازظهر",
            "فردا بعدازظهر", "امروز، صبح", "هفته آینده", "فردا عصر",
        )
        return requestTitles.mapIndexed { index, title ->
            val cat = requestCategories[index % requestCategories.size]
            val rKm = radiiKm[index % radiiKm.size]
            val angle = angles[index % angles.size]
            val latOffset = (rKm * kotlin.math.sin(angle)) / 111.0
            val lonOffset = (rKm * kotlin.math.cos(angle)) / 90.0
            val budget = budgets[index % budgets.size]
            val rating = Math.round((4.2 + (index % 5) * 0.15) * 10.0) / 10.0
            NearbyServiceRequest(
                id = "request-${index + 1}",
                title = title,
                category = cat,
                description = requestDescriptions[index % requestDescriptions.size],
                budget = budget,
                budgetLabel = "%,d تومان".format(java.util.Locale.US, budget).toPersianDigits(),
                point = GeoPoint(center.latitude + latOffset, center.longitude + lonOffset),
                createdAt = listOf("۵ دقیقه پیش", "۱۵ دقیقه پیش", "۳۰ دقیقه پیش", "۱ ساعت پیش", "۲ ساعت پیش")[index % 5],
                isUrgent = index % 3 == 0 || index == 0,
                requesterRating = rating,
                scheduledTime = times[index % times.size],
                approximateAddress = addresses[index % addresses.size],
                requesterName = requesterNames[index % requesterNames.size],
            )
        }
    }
}
