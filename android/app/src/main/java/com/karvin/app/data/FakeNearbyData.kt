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
     * Generate realistic verified providers around the given center point.
     * Well-spaced across realistic Tehran street coordinates (0.4km to 3.8km).
     */
    fun generateProviders(center: GeoPoint = this.center): List<NearbyProvider> {
        val latOffsets = doubleArrayOf(
            0.0042, -0.0035, 0.0078, -0.0062,
            0.0021, -0.0084, 0.0059, -0.0019,
            0.0093, -0.0051, 0.0015, -0.0073,
            0.0065, -0.0040, 0.0081, -0.0028,
        )
        val lngOffsets = doubleArrayOf(
            0.0051, 0.0064, -0.0043, -0.0058,
            -0.0072, 0.0031, 0.0085, -0.0022,
            -0.0039, 0.0076, -0.0065, 0.0048,
            0.0029, -0.0081, 0.0063, -0.0049,
        )

        return (0 until 12).map { i ->
            val cat = providerCategories[i % providerCategories.size]
            val name = providerNames[i % providerNames.size]
            val skills = providerSkills[cat.title] ?: listOf("خدمات فنی و اجرایی")
            val rating = 4.7 + ((i * 3) % 4) * 0.1
            val reviewCount = 24 + i * 9
            val basePrice = (180_000L + (i * 35_000L))

            NearbyProvider(
                id = "prov_${i + 1}",
                name = name,
                primarySkill = cat.title,
                skills = skills,
                point = GeoPoint(
                    latitude = center.latitude + latOffsets[i % latOffsets.size],
                    longitude = center.longitude + lngOffsets[i % lngOffsets.size],
                ),
                rating = rating,
                reviewCount = reviewCount,
                completedJobs = 45 + i * 18,
                isAvailable = i % 4 != 3,
                isVerified = true,
                basePrice = basePrice,
                shortBio = "تکنسین رسمی و مجرب اتحادیه با بیش از ۱۰ سال سابقه درخشان در محدوده منطقه.",
                responseTime = "${10 + (i * 3) % 20} دقیقه",
                portfolioItems = listOf("پروژه سعادت‌آباد", "برج مروارید شهرک غرب"),
                services = skills,
            )
        }
    }

    /**
     * Generate realistic active requests and opportunities around the given center point.
     */
    fun generateRequests(center: GeoPoint = this.center): List<NearbyServiceRequest> {
        val latOffsets = doubleArrayOf(
            -0.0025, 0.0061, -0.0074, 0.0038,
            0.0082, -0.0047, 0.0019, -0.0088,
        )
        val lngOffsets = doubleArrayOf(
            0.0038, -0.0052, 0.0069, -0.0071,
            -0.0024, 0.0083, -0.0061, 0.0045,
        )

        return (0 until 6).map { i ->
            val cat = requestCategories[i % requestCategories.size]
            val title = requestTitles[i % requestTitles.size]
            val desc = requestDescriptions[i % requestDescriptions.size]
            val budget = 250_000L + (i * 80_000L)

            NearbyServiceRequest(
                id = "req_live_${i + 1}",
                title = title,
                category = cat,
                description = desc,
                budget = budget,
                budgetLabel = "${budget.toString().toPersianDigits()} تومان",
                point = GeoPoint(
                    latitude = center.latitude + latOffsets[i % latOffsets.size],
                    longitude = center.longitude + lngOffsets[i % lngOffsets.size],
                ),
                createdAt = "۱۰ دقیقه پیش",
                isUrgent = i % 2 == 0,
                requesterRating = 4.9,
                scheduledTime = if (i % 2 == 0) "فوری (امروز)" else "فردا صبح",
                approximateAddress = addresses[i % addresses.size],
                requesterName = requesterNames[i % requesterNames.size],
            )
        }
    }
}
