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

    val workers: List<User> = firstNames.mapIndexed { index, name ->
        val category = categories[index % categories.size]
        User(
            id = "worker-${index + 1}",
            name = "$name ${lastNames[index % lastNames.size]}",
            role = UserRole.WORKER,
            city = if (index % 3 == 0) "تهران" else "کرج",
            phone = "۰۹۱۲۱۲۳۴${(10 + index).toString().takeLast(2)}",
            rating = 4.2 + (index % 8) * 0.1,
            completedJobs = 8 + index * 3,
            isVerified = index % 5 != 0,
            isAvailable = index % 4 != 0,
            point = pointFor(index, 0.008),
            skills = listOf(category.title, if (index % 2 == 0) "منظم" else "سریع", "مورد اعتماد"),
            services = listOf(services[index % services.size], services[(index + 2) % services.size]).distinct(),
            bio = "متخصص ${category.title} با سابقه کار پروژه‌ای و روزانه.",
            reviewCount = 12 + index,
        )
    }

    val employers: List<User> = (0 until 30).map { index ->
        val baseName = employerNames[index % employerNames.size]
        val displayName = if (index < employerNames.size) baseName else "$baseName، شعبه ${(index / employerNames.size + 1).toString().toPersianDigits()}"
        User(
            id = "employer-${index + 1}",
            name = displayName,
            role = UserRole.EMPLOYER,
            city = "تهران",
            phone = "۰۲۱۴۴۴۴${(10 + index).toString().takeLast(2)}",
            rating = 4.4 + (index % 5) * 0.1,
            completedJobs = 4 + index * 2,
            point = pointFor(index + 3, 0.012),
            bio = "کارفرمای تایید شده در پلتفرم کاروین.",
            reviewCount = 8 + index,
        )
    }

    val jobs: List<Job> = (0 until 50).map { index ->
        val category = categories[(index + 1) % categories.size]
        val employer = employers[index % employers.size]
        val urgent = index % 6 == 0
        Job(
            id = "job-${index + 1}",
            title = jobTitles[index % jobTitles.size],
            category = category,
            description = descriptions[index % descriptions.size],
            employer = employer,
            requiredWorkers = if (index % 7 == 0) 2 else 1,
            genderRequirement = GenderRequirement.ANY,
            date = LocalDate.now().plusDays((index % 4).toLong()),
            startTime = LocalTime.of(9 + index % 9, if (index % 2 == 0) 0 else 30),
            durationHours = listOf(2.0, 4.0, 6.0, 8.0)[index % 4],
            amount = 450_000L + (index % 10) * 125_000L,
            paymentType = PaymentType.values()[index % PaymentType.values().size],
            address = addresses[index % addresses.size],
            point = pointFor(index, 0.01),
            isUrgent = urgent,
            requiredSkills = listOf(category.title, if (index % 2 == 0) "تجربه مرتبط" else "توان بدنی"),
            status = listOf(
                JobStatus.OPEN,
                JobStatus.APPLIED,
                JobStatus.ACCEPTED,
                JobStatus.WORKER_ON_THE_WAY,
                JobStatus.ARRIVED,
                JobStatus.IN_PROGRESS,
                JobStatus.COMPLETED,
                JobStatus.RATED,
            )[index % 8],
            applicantCount = index % 5,
        )
    }

    val applications: List<Application> = (0 until 12).map { index ->
        Application(
            id = "application-${index + 1}",
            jobId = jobs[index].id,
            worker = workers[(index * 2) % workers.size],
            status = listOf(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED)[index % 3],
            createdAt = LocalDateTime.now().minusHours((index + 1).toLong()),
            message = if (index % 2 == 0) "سلام، آماده شروع کار در زمان اعلام شده هستم." else "سابقه مشابه این پروژه را دارم.",
        )
    }

    val reviews: Map<String, List<Review>> = workers.associate { worker ->
        worker.id to listOf(
            Review("review-${worker.id}-1", "مریم رضایی", 5, "کار تمیز و برخورد حرفه‌ای.", LocalDate.now().minusDays(3)),
            Review("review-${worker.id}-2", "شرکت نوآوران", 4, "سر وقت و مسئولیت‌پذیر.", LocalDate.now().minusDays(11)),
        )
    }

    val messages: List<ChatMessage> = listOf(
        ChatMessage("message-1", "conversation-1", employers.first().id, "سلام، برای جزئیات کار در خدمتم.", LocalDateTime.now().minusMinutes(24), true),
        ChatMessage("message-2", "conversation-1", workers.first().id, "ممنون، ساعت شروع برای من مناسب است.", LocalDateTime.now().minusMinutes(18), true),
        ChatMessage("message-3", "conversation-2", employers[1].id, "لطفاً نمونه کارهای قبلی را ارسال کنید.", LocalDateTime.now().minusHours(3), false),
    )

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
