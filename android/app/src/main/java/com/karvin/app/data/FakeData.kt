package com.karvin.app.data

import com.karvin.app.domain.model.AppNotification
import com.karvin.app.domain.model.Application
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.Category
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.Conversation
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.GenderRequirement
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.PaymentType
import com.karvin.app.domain.model.Review
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

object FakeData {
    val center = GeoPoint(35.7219, 51.3347)

    val categories = listOf(
        Category("general", "کارگر ساده", "کار"),
        Category("electrician", "برقکار", "برق"),
        Category("plumber", "لوله‌کش", "آب"),
        Category("painter", "نقاش ساختمان", "رنگ"),
        Category("mason", "بنا", "ساخت"),
        Category("welder", "جوشکار", "فلز"),
        Category("repair", "تعمیرکار", "تعمیر"),
        Category("driver", "راننده", "رانندگی"),
        Category("cleaning", "نظافت", "خانه"),
        Category("cooking", "آشپزی", "آشپزی"),
        Category("services", "خدمات", "خدمت"),
        Category("shop", "کار فروشگاهی", "فروش"),
        Category("warehouse", "انبارداری", "انبار"),
        Category("moving", "باربری", "بار"),
        Category("gardening", "باغبانی", "باغ"),
        Category("office", "کار اداری", "اداری"),
        Category("other", "سایر", "سایر"),
    )

    /** خدمات ارائه شده توسط متخصص‌ها. */
    val services = listOf(
        "سرویس سریع",
        "حضور در محل",
        "پروژه بلندمدت",
        "مشاوره تخصصی",
    )

    private val firstNames = listOf(
        "محمد", "علی", "زهرا", "امیر", "فاطمه", "رضا", "مریم", "حسین", "سارا", "مهدی",
        "نگار", "نرگس", "حمید", "الهام", "پویان", "سمیه", "کیانا", "آرمان", "لیلا", "سهیل",
        "شهاب", "میلاد", "فرشاد", "پریسا", "احسان", "بهزاد", "آتنا", "نوید", "مرضیه", "بهنام",
    )

    private val lastNames = listOf(
        "رضایی", "مرادی", "احمدی", "حسینی", "کریمی", "موسوی", "صادقی", "جعفری",
        "نوروزی", "اکبری", "طاهری", "حیدری",
    )

    private val employerNames = listOf(
        "فروشگاه آریا", "کافه خانه سبز", "شرکت نوآوران", "ساختمان پزشکان بهار", "رستوران نارنج",
        "کارگاه چوبین", "دفتر خدمات شهری", "مجموعه ورزشی هیراد", "فروشگاه مرکزی", "گروه ساختمانی سپهر",
    )

    private val jobTitles = listOf(
        "نصب کولر", "کمک در اسباب‌کشی", "نظافت واحد اداری", "تعمیر شیر آب", "رنگ‌آمیزی اتاق",
        "چیدمان انبار", "تحویل سفارش با خودرو", "کمک آشپز", "سیم‌کشی ساختمان", "هرس درختان",
    )

    private val descriptions = listOf(
        "به نیروی دقیق و مسئولیت‌پذیر برای همکاری کوتاه‌مدت نیاز داریم.",
        "محل کار آماده است و پرداخت در پایان کار انجام می‌شود.",
        "سابقه مرتبط مزیت محسوب می‌شود اما آموزش اولیه ارائه خواهد شد.",
        "لطفاً فقط در صورت امکان حضور در زمان اعلام شده درخواست دهید.",
    )

    private val addresses = listOf(
        "تهران، بلوار کشاورز", "تهران، یوسف‌آباد", "تهران، میدان ونک", "تهران، جردن", "تهران، صادقیه",
        "تهران، ستارخان", "تهران، امیرآباد", "تهران، تهرانپارس", "تهران، پاسداران", "تهران، شهرک غرب",
    )

    val defaultWorker = User(
        id = "worker-me",
        name = "کاربر انجام‌دهنده",
        role = UserRole.PROVIDER,
        city = "تهران",
        phone = "09120000000",
        rating = 5.0,
        completedJobs = 0,
        isVerified = true,
        isAvailable = true,
        point = center,
        skills = listOf("آماده به کار"),
        services = emptyList(),
        bio = "حساب کاربری متخصص در پلتفرم کارجور",
        reviewCount = 0,
    )

    val defaultEmployer = User(
        id = "employer-me",
        name = "کاربر کارفرما",
        role = UserRole.REQUESTER,
        city = "تهران",
        phone = "09120000000",
        rating = 5.0,
        completedJobs = 0,
        point = center,
        bio = "حساب کاربری کارفرما در پلتفرم کارجور",
        reviewCount = 0,
    )

    val workers: List<User> = listOf(defaultWorker)
    val employers: List<User> = listOf(defaultEmployer)
    val jobs: List<Job> = listOf(
        Job(
            id = "req_ae8ecb2f",
            title = "سرویس کولر آبی و برقکاری",
            category = categories.first { it.id == "repair" },
            description = "درخواست واقعی ثبت شده از اپلیکیشن اندروید (Pixel 7a)",
            employer = defaultEmployer,
            requiredWorkers = 1,
            genderRequirement = GenderRequirement.ANY,
            date = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            durationHours = 3.0,
            amount = 350000L,
            paymentType = PaymentType.WALLET,
            address = "تهران، میدان انقلاب",
            point = center,
            isUrgent = true,
            requiredSkills = listOf("برقکاری", "تعمیر کولر"),
            status = JobStatus.ACCEPTED,
            applicantCount = 1,
        ),
        Job(
            id = "req_9719f236",
            title = "درخواست خدمت نقاش ساختمان",
            category = categories.first { it.id == "painter" },
            description = "توضیحات تکمیلی پس از هماهنگی اعلام می‌شود.",
            employer = defaultEmployer,
            requiredWorkers = 1,
            genderRequirement = GenderRequirement.ANY,
            date = LocalDate.now(),
            startTime = LocalTime.of(9, 0),
            durationHours = 5.0,
            amount = 300000L,
            paymentType = PaymentType.WALLET,
            address = "تهران، بلوار کشاورز",
            point = center,
            isUrgent = false,
            requiredSkills = listOf("نقاشی"),
            status = JobStatus.OPEN,
            applicantCount = 0,
        )
    )
    val applications: List<Application> = emptyList()
    val reviews: Map<String, List<Review>> = emptyMap()
    val messages: List<ChatMessage> = emptyList()

    val notifications: List<AppNotification> = listOf(
        AppNotification("notification-1", NotificationType.JOB_NEARBY, "درخواست نزدیک شما", "یک کار جدید در فاصله ۲٫۳ کیلومتری منتشر شد.", LocalDateTime.now().minusMinutes(12), false),
        AppNotification("notification-2", NotificationType.APPLICATION_UPDATE, "درخواست شما پذیرفته شد", "کارفرما درخواست همکاری شما را تایید کرد.", LocalDateTime.now().minusHours(2), false),
        AppNotification("notification-3", NotificationType.RATING, "زمان امتیازدهی", "تجربه آخرین کار خود را ثبت کنید.", LocalDateTime.now().minusDays(1), true),
    )

    fun conversations(currentUserId: String): List<Conversation> = employers.take(3).mapIndexed { index, employer ->
        val last = messages.filter { it.conversationId == "conversation-${index + 1}" }.maxByOrNull { it.sentAt }
        Conversation("conversation-${index + 1}", employer, last, if (index == 1) 1 else 0)
    }

    private fun pointFor(index: Int, factor: Double): GeoPoint {
        val latOffset = ((index * 17) % 19 - 9) * factor
        val lonOffset = ((index * 11) % 19 - 9) * factor
        return GeoPoint(center.latitude + latOffset, center.longitude + lonOffset)
    }

}
