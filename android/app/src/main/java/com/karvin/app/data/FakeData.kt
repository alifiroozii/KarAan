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

    /** دسته‌بندی‌های خدمات سلامت مطابق طرح؛ چهار مورد اول تب‌های نقشه را می‌سازند. */
    val categories = listOf(
        Category("paramedical", "پیراپزشکی", "پارا"),
        Category("nursing", "پرستاری", "پرستار"),
        Category("physio", "فیزیوتراپی", "فیزیو"),
        Category("medical", "طبابت", "طب"),
        Category("lab", "آزمایش", "آزمایش"),
        Category("elderly", "مراقبت از سالمند", "سالمند"),
        Category("injection", "تزریقات", "تزریق"),
        Category("dressing", "پانسمان", "پانسمان"),
    )

    /** خدمات ارائه شده توسط متخصص‌ها (چیپ‌های «خدمات ارائه شده»). */
    val services = listOf(
        "ویزیت در منزل",
        "ویزیت بیمارستان",
        "ویزیت آنلاین",
        "آزمایش در منزل",
        "تزریقات در منزل",
        "پانسمان و بخیه",
        "فیزیوتراپی در منزل",
        "مراقبت شبانه",
    )

    private val specialties = mapOf(
        "پیراپزشکی" to listOf("شنوایی‌سنجی", "بینایی‌سنجی", "تغذیه بالینی", "روانشناسی", "کاردرمانی"),
        "پرستاری" to listOf("تزریقات", "پانسمان", "سرم درمانی", "مراقبت از سالمند"),
        "فیزیوتراپی" to listOf("کمردرد", "بیماری‌های ورزشی", "ناهنجاری", "ماساژ درمانی"),
        "طبابت" to listOf("طب عمومی", "طب خانواده", "پیگیری درمان", "مشاوره دارویی"),
        "آزمایش" to listOf("آزمایش خون", "نمونه‌گیری در منزل", "آزمایش ادرار"),
        "مراقبت از سالمند" to listOf("مراقبت شبانه", "یادآوری دارو", "حمام سالمند"),
        "تزریقات" to listOf("تزریق عضلانی", "تزریق وریدی", "سرم درمانی"),
        "پانسمان" to listOf("پانسمان زخم", "کشیدن بخیه", "مراقبت پس از جراحی"),
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

    private val requesterNames = listOf(
        "امیر", "سارا", "نرگس", "حسین", "مریم", "علی", "شیما", "رضا", "مینا", "کاربر مهمان",
    )

    private val requestTitles = listOf(
        "ویزیت در منزل",
        "تزریقات و سرم در منزل",
        "پانسمان زخم",
        "فیزیوتراپی کمردرد",
        "آزمایش خون در منزل",
        "مراقبت از سالمند",
        "ویزیت پزشک عمومی",
        "ماساژ درمانی ورزشی",
        "مراقبت پس از جراحی",
        "مشاوره تغذیه",
    )

    private val requestDescriptions = listOf(
        "برای بیمار کمتحرک ویزیت در منزل نیاز دارم؛ لطفاً بعدازظهر در دسترس باشید.",
        "به پرستار مجرب برای تزریق سرم در منزل نیاز داریم؛ تجهیزات موجود است.",
        "دوره فیزیوتراپی پس از جراحی زانو؛ جلسات در منزل بیمار انجام می‌شود.",
        "لطفاً پیش از مراجعه هماهنگ کنید و زمان دقیق حضور را اعلام بفرمایید.",
    )

    private val addresses = listOf(
        "تهران، ولنجک", "تهران، سعادت‌آباد", "تهران، ونک", "تهران، جردن", "تهران، شهرک غرب",
        "تهران، پاسداران", "تهران، نیاوران", "تهران، یوسف‌آباد", "تهران، امیرآباد", "تهران، زعفرانیه",
    )

    val workers: List<User> = firstNames.mapIndexed { index, name ->
        val category = categories[index % categories.size]
        val specialtyPool = specialties[category.title].orEmpty()
        val servicesForWorker = listOf(services[index % services.size], services[(index + 2) % services.size]).distinct()
        User(
            id = "worker-${index + 1}",
            name = "$name ${lastNames[index % lastNames.size]}",
            role = UserRole.WORKER,
            city = if (index % 3 == 0) "تهران، ولنجک" else "تهران",
            phone = "۰۹۱۲۱۲۳۴${(10 + index).toString().takeLast(2)}",
            rating = 4.5 + (index % 5) * 0.1,
            completedJobs = 30 + index * 7,
            isVerified = index % 5 != 0,
            isAvailable = index % 4 != 0,
            point = pointFor(index, 0.008),
            skills = listOf(category.title) + specialtyPool.take(3),
            services = servicesForWorker,
            bio = "متخصص ${category.title} با تجربه ویزیت در منزل و برخورد حرفه‌ای با بیماران.",
            reviewCount = 120 + index * 9,
        )
    }

    val employers: List<User> = (0 until 30).map { index ->
        val baseName = requesterNames[index % requesterNames.size]
        val displayName = if (index < requesterNames.size) baseName else "$baseName ${(index / requesterNames.size + 1).toString().toPersianDigits()}"
        User(
            id = "employer-${index + 1}",
            name = displayName,
            role = UserRole.EMPLOYER,
            city = "تهران",
            phone = "۰۹۱۲۴۴۴${(10 + index).toString().takeLast(2)}",
            rating = 4.4 + (index % 5) * 0.1,
            completedJobs = 2 + index,
            point = pointFor(index + 3, 0.012),
            bio = "کاربر تایید شده کاروین.",
            reviewCount = 3 + index,
        )
    }

    val jobs: List<Job> = (0 until 50).map { index ->
        val category = categories[(index + 1) % categories.size]
        val employer = employers[index % employers.size]
        val urgent = index % 6 == 0
        Job(
            id = "job-${index + 1}",
            title = requestTitles[index % requestTitles.size],
            category = category,
            description = requestDescriptions[index % requestDescriptions.size],
            employer = employer,
            requiredWorkers = 1,
            genderRequirement = GenderRequirement.ANY,
            date = LocalDate.now().plusDays((index % 3).toLong()),
            startTime = LocalTime.of(14 + index % 6, if (index % 2 == 0) 0 else 30),
            durationHours = listOf(1.0, 2.0, 3.0, 4.0)[index % 4],
            amount = 350_000L + (index % 10) * 85_000L,
            paymentType = PaymentType.values()[index % PaymentType.values().size],
            address = addresses[index % addresses.size],
            point = pointFor(index, 0.01),
            isUrgent = urgent,
            requiredSkills = listOf(category.title, services[(index + 1) % services.size]),
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
            message = if (index % 2 == 0) "سلام، در زمان اعلام شده در دسترس هستم و می‌توانم مراجعه کنم." else "تجربه مشابه این خدمت را دارم؛ آماده مراجعه هستم.",
        )
    }

    val reviews: Map<String, List<Review>> = workers.associate { worker ->
        worker.id to listOf(
            Review("review-${worker.id}-1", "مریم رضایی", 5, "برخورد حرفه‌ای و منظم بودند؛ خیالم راحت شد.", LocalDate.now().minusDays(3)),
            Review("review-${worker.id}-2", "حسین کریمی", 4, "سر وقت آمدند و توضیحات کامل دادند.", LocalDate.now().minusDays(11)),
        )
    }

    val messages: List<ChatMessage> = listOf(
        ChatMessage("message-1", "conversation-1", employers.first().id, "سلام، برای ویزیت در منزل هماهنگی کنید لطفاً.", LocalDateTime.now().minusMinutes(24), true),
        ChatMessage("message-2", "conversation-1", workers.first().id, "ممنون، فردا بعدازظهر در دسترسم است.", LocalDateTime.now().minusMinutes(18), true),
        ChatMessage("message-3", "conversation-2", employers[1].id, "لطفاً مدارک و تخصص‌های خود را ارسال کنید.", LocalDateTime.now().minusHours(3), false),
    )

    val notifications: List<AppNotification> = listOf(
        AppNotification("notification-1", NotificationType.JOB_NEARBY, "درخواست نزدیک شما", "یک درخواست ویزیت در فاصله ۲٫۳ کیلومتری ثبت شد.", LocalDateTime.now().minusMinutes(12), false),
        AppNotification("notification-2", NotificationType.APPLICATION_UPDATE, "درخواست شما تایید شد", "متخصص درخواست شما را پذیرفت و زمان مراجعه را اعلام کرد.", LocalDateTime.now().minusHours(2), false),
        AppNotification("notification-3", NotificationType.RATING, "زمان امتیازدهی", "تجربه آخرین ویزیت خود را ثبت کنید.", LocalDateTime.now().minusDays(1), true),
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
