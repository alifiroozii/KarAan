package com.karvin.app.data.repository

import com.karvin.app.data.local.entity.EmployerProfileEntity
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.local.entity.JobEntity
import com.karvin.app.data.local.entity.NotificationEntity
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.local.entity.WorkerProfileEntity
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.ChatConversation
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.MessageType
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.TrustBadge
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import java.util.UUID

object FakeDataGenerator {

    val categories = listOf(
        JobCategory(id = "cat_1", nameFa = "ساختمان و عمران", nameEn = "Construction", iconName = "construction", jobCount = 28),
        JobCategory(id = "cat_2", nameFa = "انبارداری و لجستیک", nameEn = "Logistics", iconName = "inventory", jobCount = 22),
        JobCategory(id = "cat_3", nameFa = "فنی و تاسیسات", nameEn = "Technical Services", iconName = "build", jobCount = 26),
        JobCategory(id = "cat_4", nameFa = "رستوران و تشریفات", nameEn = "Hospitality", iconName = "restaurant", jobCount = 31),
        JobCategory(id = "cat_5", nameFa = "نظافت و بهداشت", nameEn = "Cleaning", iconName = "cleaning_services", jobCount = 19),
        JobCategory(id = "cat_6", nameFa = "حمل و نقل و باربری", nameEn = "Transport", iconName = "local_shipping", jobCount = 24),
        JobCategory(id = "cat_7", nameFa = "کشاورزی و باغبانی", nameEn = "Gardening", iconName = "yard", jobCount = 10)
    )

    val skills = listOf(
        Skill(id = "sk_1", nameFa = "بنایی و سیمان‌کاری", nameEn = "Masonry", categoryId = "cat_1"),
        Skill(id = "sk_2", nameFa = "نقاشی ساختمان", nameEn = "Painting", categoryId = "cat_1"),
        Skill(id = "sk_3", nameFa = "گچ‌کاری و کناف", nameEn = "Plastering", categoryId = "cat_1"),
        Skill(id = "sk_4", nameFa = "کاشی و سرامیک‌کاری", nameEn = "Tiling", categoryId = "cat_1"),
        Skill(id = "sk_5", nameFa = "بسته‌بندی و بارچینی", nameEn = "Packing", categoryId = "cat_2"),
        Skill(id = "sk_6", nameFa = "رانندگی لیفتراک", nameEn = "Forklift", categoryId = "cat_2"),
        Skill(id = "sk_7", nameFa = "حسابداری انبار", nameEn = "Warehouse Inventory", categoryId = "cat_2"),
        Skill(id = "sk_8", nameFa = "برق‌کاری صنعتی و ساختمان", nameEn = "Electrician", categoryId = "cat_3"),
        Skill(id = "sk_9", nameFa = "لوله‌کشی و پکیج", nameEn = "Plumbing", categoryId = "cat_3"),
        Skill(id = "sk_10", nameFa = "جوشکاری و آهنگری", nameEn = "Welding", categoryId = "cat_3"),
        Skill(id = "sk_11", nameFa = "نصب دوربین و دزدگیر", nameEn = "Security Tech", categoryId = "cat_3"),
        Skill(id = "sk_12", nameFa = "کمک‌آشپز و تخته‌کار", nameEn = "Kitchen Prep", categoryId = "cat_4"),
        Skill(id = "sk_13", nameFa = "سالن‌داری و ویتر", nameEn = "Waiter", categoryId = "cat_4"),
        Skill(id = "sk_14", nameFa = "باریستا و بارتندر", nameEn = "Barista", categoryId = "cat_4"),
        Skill(id = "sk_15", nameFa = "ظرفشویی و نظافت رستوران", nameEn = "Dishwashing", categoryId = "cat_4"),
        Skill(id = "sk_16", nameFa = "نظافت صنعتی و راه‌پله", nameEn = "Industrial Cleaning", categoryId = "cat_5"),
        Skill(id = "sk_17", nameFa = "شستشوی نما و شیشه", nameEn = "Window Cleaning", categoryId = "cat_5"),
        Skill(id = "sk_18", nameFa = "جابجایی اثاثیه و حمل بار سنگین", nameEn = "Heavy Moving", categoryId = "cat_6"),
        Skill(id = "sk_19", nameFa = "رانندگی وانت بار و نیسان", nameEn = "Pickup Driver", categoryId = "cat_6"),
        Skill(id = "sk_20", nameFa = "باغبانی و هرس درختان", nameEn = "Gardening", categoryId = "cat_7")
    )

    private val tehranLocations = listOf(
        Triple("سعادت‌آباد، میدان کاج", 35.7836, 51.3789),
        Triple("شهرک غرب، بلوار دادمان", 35.7654, 35.7654.let { 51.3621 }),
        Triple("صادقیه، فلکه دوم", 35.7214, 51.3321),
        Triple("پونک، میرزابابایی", 35.7601, 51.3412),
        Triple("میدان ونک، خیابان ملاصدرا", 35.7578, 51.4098),
        Triple("تجریش، خیابان فناخسرو", 35.8054, 51.4289),
        Triple("پاسداران، نوبنیاد", 35.7921, 51.4789),
        Triple("تهرانپارس، فلکه اول", 35.7312, 51.5289),
        Triple("نازی‌آباد، خیابان بازار دوم", 35.6421, 51.4012),
        Triple("بازار بزرگ تهران، خیابان ۱۵ خرداد", 35.6741, 51.4201),
        Triple("جاده مخصوص کرج، کیلومتر ۱۴", 35.7012, 51.1892),
        Triple("شهرک صنعتی چهاردانگه", 35.5987, 51.3098),
        Triple("یافت‌آباد، میدان معلم", 35.6612, 51.3341),
        Triple("ستارخان، خیابان خسرو شمالی", 35.7198, 51.3501),
        Triple("کرج، مهرشهر، بلوار ارم", 35.8021, 50.9123),
        Triple("کرج، عظیمیه، میدان اسبی", 35.8341, 51.0021)
    )

    private val persianMaleNames = listOf(
        "رضا محمدی", "علی کاظمی", "حسین ابراهیمی", "سعید مرادی", "امیرحسین رضایی",
        "مهدی صادقی", "بهروز اکبری", "کامران رستمی", "محمود احمدی", "مجید نصیری",
        "پیمان حیدری", "مهران کریمی", "سید جواد موسوی", "امید قربانی", "فرشید طاهری",
        "داوود قنبری", "مسعود فراهانی", "احسان شاکری", "کیوان سلطانی", "بهنام رحیمی"
    )

    private val companyNames = listOf(
        "شرکت ساختمانی سازه گستر البرز", "مجتمع لجستیک پخش آریا", "کافه رستوران نارنجستان",
        "پیمانکاری عمران پایدار", "باربری و حمل‌ونقل نگین پایتخت", "تاسیسات و برق صنعتی آذرخش",
        "مجتمع تجاری کوروش", "هتل و تشریفات اسپیناس", "انبار مرکزی داروپخش", "خدمات نظافتی پاک رویال",
        "کارگاه آهنگری و جوشکاری سهند", "پخش سراسری مواد غذایی میهن", "مجموعه پذیرایی سنتی البرز"
    )

    // Generate 100 realistic jobs
    fun generate100Jobs(): List<Job> {
        val jobs = mutableListOf<Job>()
        val baseTime = System.currentTimeMillis()

        for (i in 1..100) {
            val loc = tehranLocations[i % tehranLocations.size]
            val cat = categories[i % categories.size]
            val comp = companyNames[i % companyNames.size]
            val sk = skills.filter { it.categoryId == cat.id }
            val requiredSkillsList = sk.shuffled().take((1..3).random()).map { it.nameFa }
            val isUrgent = (i % 4 == 0)
            val salary = (750000L + (i % 15) * 100000L)
            val workersCount = (1..6).random()

            val jobTitles = when (cat.id) {
                "cat_1" -> listOf("بنای ماهر دیوارچینی و ملات‌کاری", "نقاش کناف و رنگ روغن پروژه نمایشگاهی", "استادکار کاشی و سرامیک پرسلان")
                "cat_2" -> listOf("نیروی انباردار و بارچین شیفت عصر", "راننده لیفتراک با گواهینامه معتبر", "بسته‌بندی و چیدمان پالت فروشگاهی")
                "cat_3" -> listOf("برق‌کار صنعتی و تابلو برق پروژه اداری", "لوله‌کش و نصاب تاسیسات موتورخانه", "جوشکار اسکلت فلزی و گاز خانگی")
                "cat_4" -> listOf("ویتر و سالن‌دار شیفت عصر و شب", "کمک‌آشپز ماهر فرنگی و تخته‌کار", "باریستا مسلط به لاته آرت و بار سرد")
                "cat_5" -> listOf("نظافتچی صنعتی کارخانه و سوله", "شستشوی تخصصی نمای شیشه‌ای ساختمان", "نیروی نظافت راه‌پله و پارکینگ برج")
                "cat_6" -> listOf("کارگر ماهر تخلیه و بارگیری اثاثیه منزل", "راننده وانت با خودرو جهت پخش مویرگی", "تیم حمل بار سنگین یخچال ساید و گاوصندوق")
                else -> listOf("کارگر باغبانی و محوطه‌سازی ویلا", "هرس درختان و چمن‌زنی مجتمع مسکونی")
            }

            val title = "${jobTitles[i % jobTitles.size]} (${loc.first.split("،").first()})"

            jobs.add(
                Job(
                    id = "job_$i",
                    employerId = "emp_${100 + (i % 10)}",
                    employerName = "مدیر کارگاه ${persianMaleNames[i % persianMaleNames.size]}",
                    businessName = comp,
                    employerRating = 4.5f + ((i % 5) * 0.1f),
                    title = title,
                    description = "برای انجام پروژه در محدوده ${loc.first} نیازمند نیروی متعهد، خوش‌قول و با انگیزه هستیم. پرداخت نقدی و بیمه حوادث روزانه برقرار است.",
                    categoryId = cat.id,
                    categoryName = cat.nameFa,
                    numberOfWorkersNeeded = workersCount,
                    currentWorkersCount = (0 until workersCount).random(),
                    date = "۱۴۰۳/۰۶/${PersianDateFormatter.toPersianDigits(String.format("%02d", 5 + (i % 20)))}",
                    startTime = "۰۸:۳۰",
                    endTime = "۱۷:۰۰",
                    salaryToman = salary,
                    isHourlySalary = (i % 5 == 0),
                    city = if (loc.first.contains("کرج")) "کرج" else "تهران",
                    address = loc.first,
                    latitude = loc.second + ((i % 10) - 5) * 0.003,
                    longitude = loc.third + ((i % 10) - 5) * 0.003,
                    requiredSkills = requiredSkillsList,
                    status = JobStatus.OPEN,
                    createdAt = baseTime - (i * 1800000L),
                    isUrgent = isUrgent,
                    hasApplied = (i == 1 || i == 2)
                )
            )
        }
        return jobs
    }

    // Generate 100 realistic workers for employer discovery map & matching
    fun generate100Workers(): List<WorkerProfile> {
        val workers = mutableListOf<WorkerProfile>()

        for (i in 1..100) {
            val name = persianMaleNames[i % persianMaleNames.size] + " " + (if (i > 20) "($i)" else "")
            val loc = tehranLocations[(i + 3) % tehranLocations.size]
            val cat = categories[i % categories.size]
            val workerSkills = skills.filter { it.categoryId == cat.id }.take((1..3).random())
            val rating = (4.4f + ((i % 6) * 0.1f)).coerceAtMost(5.0f)
            val exp = (2 + (i % 12))
            val completedJobs = (15 + i * 4)
            val attendance = (92 + (i % 8))

            val trustBadgesList = mutableListOf(TrustBadge.BADGE_IDENTITY)
            if (completedJobs >= 50) trustBadgesList.add(TrustBadge.BADGE_100_JOBS)
            if (attendance >= 96) trustBadgesList.add(TrustBadge.BADGE_PUNCTUAL)
            if (rating >= 4.8f) trustBadgesList.add(TrustBadge.BADGE_TOP_RATED)

            workers.add(
                WorkerProfile(
                    userId = "worker_$i",
                    fullName = name,
                    nationalId = "001" + String.format("%07d", i * 1234),
                    birthDate = "137" + (i % 9) + "/05/10",
                    gender = Gender.MALE,
                    avatarUrl = null,
                    skills = workerSkills,
                    categories = listOf(cat),
                    experienceYears = exp,
                    city = if (loc.first.contains("کرج")) "کرج" else "تهران",
                    address = loc.first,
                    latitude = loc.second + ((i % 8) - 4) * 0.0025,
                    longitude = loc.third + ((i % 8) - 4) * 0.0025,
                    availableDays = listOf("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"),
                    availableHours = "۰۸:۰۰ الی ۱۸:۰۰",
                    preferredJobs = workerSkills.map { it.nameFa },
                    rating = rating,
                    attendanceScorePercentage = attendance,
                    completedJobsCount = completedJobs,
                    isAvailableForWork = true,
                    isAvailableNow = (i % 3 != 0), // 66% available right now
                    trustBadges = trustBadgesList,
                    totalEarningsToman = (completedJobs * 1100000L)
                )
            )
        }
        return workers
    }

    // Pre-seeded Chat Conversations
    fun generateInitialConversations(): List<ChatConversation> {
        val now = System.currentTimeMillis()
        return listOf(
            ChatConversation(
                id = "conv_1",
                otherUserId = "emp_101",
                otherUserName = "مهندس علیرضا رضایی",
                otherUserRole = UserRole.EMPLOYER,
                otherUserAvatarUrl = null,
                otherUserRating = 4.9f,
                isVerified = true,
                lastMessage = "موقعیت کارگاه سعادت‌آباد براتون ارسال شد، لطفاً فردا ساعت ۸ آماده باشید.",
                lastMessageTime = now - 900000,
                unreadCount = 1,
                relatedJobTitle = "برق‌کار صنعتی پروژه اداری"
            ),
            ChatConversation(
                id = "conv_2",
                otherUserId = "emp_102",
                otherUserName = "حاج حسین میرزایی",
                otherUserRole = UserRole.EMPLOYER,
                otherUserAvatarUrl = null,
                otherUserRating = 4.8f,
                isVerified = true,
                lastMessage = "سلام آقا محمد، برای شیفت انبارداری عصر امروز هماهنگ هستیم؟",
                lastMessageTime = now - 7200000,
                unreadCount = 0,
                relatedJobTitle = "انباردار و بارچین شیفت عصر"
            ),
            ChatConversation(
                id = "conv_3",
                otherUserId = "emp_103",
                otherUserName = "سرکار خانم صادقی",
                otherUserRole = UserRole.EMPLOYER,
                otherUserAvatarUrl = null,
                otherUserRating = 5.0f,
                isVerified = true,
                lastMessage = "دستمزد شیفت دیشب به حسابتان منظور گردید، ممنون از همکاری دقیق شما.",
                lastMessageTime = now - 86400000,
                unreadCount = 0,
                relatedJobTitle = "سالن‌دار و ویتر کافه نارنجستان"
            )
        )
    }

    fun generateInitialMessages(conversationId: String): List<ChatMessage> {
        val now = System.currentTimeMillis()
        return when (conversationId) {
            "conv_1" -> listOf(
                ChatMessage(
                    id = "msg_101",
                    conversationId = conversationId,
                    senderId = "emp_101",
                    senderName = "مهندس علیرضا رضایی",
                    senderRole = UserRole.EMPLOYER,
                    content = "سلام آقا محمد وقت بخیر. رزومه و سوابق برق‌کاری شما رو دیدم بسیار عالیه.",
                    messageType = MessageType.TEXT,
                    timestamp = now - 3600000,
                    isFromMe = false
                ),
                ChatMessage(
                    id = "msg_102",
                    conversationId = conversationId,
                    senderId = "worker_default",
                    senderName = "محمد حسینی",
                    senderRole = UserRole.WORKER,
                    content = "سلام مهندس رضایی، ممنون از اعتمادتون. ابزار کامل برق‌کاری و کابل‌کشی دارم.",
                    messageType = MessageType.TEXT,
                    timestamp = now - 3000000,
                    isFromMe = true
                ),
                ChatMessage(
                    id = "msg_103",
                    conversationId = conversationId,
                    senderId = "emp_101",
                    senderName = "مهندس علیرضا رضایی",
                    senderRole = UserRole.EMPLOYER,
                    content = "لوکیشن دقیق ورودی کارگاه پروژه سعادت‌آباد:",
                    messageType = MessageType.LOCATION,
                    latitude = 35.7836,
                    longitude = 51.3789,
                    locationName = "تهران، سعادت‌آباد، میدان کاج، خ سرو غربی، پلاک ۲۴",
                    timestamp = now - 1800000,
                    isFromMe = false
                ),
                ChatMessage(
                    id = "msg_104",
                    conversationId = conversationId,
                    senderId = "emp_101",
                    senderName = "مهندس علیرضا رضایی",
                    senderRole = UserRole.EMPLOYER,
                    content = "موقعیت کارگاه سعادت‌آباد براتون ارسال شد، لطفاً فردا ساعت ۸ آماده باشید.",
                    messageType = MessageType.TEXT,
                    timestamp = now - 900000,
                    isFromMe = false
                )
            )
            else -> listOf(
                ChatMessage(
                    id = "msg_201",
                    conversationId = conversationId,
                    senderId = "other_user",
                    senderName = "کارفرما",
                    senderRole = UserRole.EMPLOYER,
                    content = "سلام، در صورت تمایل به همکاری پیام دهید.",
                    messageType = MessageType.TEXT,
                    timestamp = now - 7200000,
                    isFromMe = false
                )
            )
        }
    }

    fun createInitialJobs(): List<JobEntity> {
        val domainJobs = generate100Jobs()
        return domainJobs.take(30).map { job ->
            JobEntity(
                id = job.id,
                employerId = job.employerId,
                employerName = job.employerName,
                businessName = job.businessName,
                title = job.title,
                description = job.description,
                categoryId = job.categoryId,
                categoryName = job.categoryName,
                numberOfWorkersNeeded = job.numberOfWorkersNeeded,
                currentWorkersCount = job.currentWorkersCount,
                date = job.date,
                startTime = job.startTime,
                endTime = job.endTime,
                salaryToman = job.salaryToman,
                isHourlySalary = job.isHourlySalary,
                city = job.city,
                address = job.address,
                latitude = job.latitude,
                longitude = job.longitude,
                requiredSkills = job.requiredSkills,
                status = job.status,
                createdAt = job.createdAt,
                isUrgent = job.isUrgent,
                hasApplied = job.hasApplied
            )
        }
    }

    fun createInitialApplications(): List<JobApplicationEntity> {
        val now = System.currentTimeMillis()
        return listOf(
            JobApplicationEntity(
                id = "app_1",
                jobId = "job_1",
                jobTitle = "برق‌کار صنعتی ماهر برای پروژه اداری",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                workerAvatarUrl = null,
                workerRating = 4.8f,
                workerSkills = listOf("برق‌کاری صنعتی و ساختمان", "لوله‌کشی و پکیج"),
                workerExperienceYears = 6,
                employerId = "emp_101",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                salaryToman = 1350000,
                jobDate = "۱۴۰۳/۰۶/۰۵",
                status = ApplicationStatus.ACCEPTED,
                appliedAt = now - 86400000,
                rejectionReason = null
            ),
            JobApplicationEntity(
                id = "app_2",
                jobId = "job_2",
                jobTitle = "نیروی انباردار و بارچین شیفت عصر",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                workerAvatarUrl = null,
                workerRating = 4.8f,
                workerSkills = listOf("بسته‌بندی و بارچینی"),
                workerExperienceYears = 4,
                employerId = "emp_102",
                businessName = "مجتمع لجستیک پخش آریا",
                salaryToman = 950000,
                jobDate = "۱۴۰۳/۰۶/۰۴",
                status = ApplicationStatus.PENDING,
                appliedAt = now - 3600000,
                rejectionReason = null
            ),
            JobApplicationEntity(
                id = "app_3",
                jobId = "job_1",
                jobTitle = "برق‌کار صنعتی ماهر برای پروژه اداری",
                workerId = "worker_202",
                workerName = "رضا باقری",
                workerAvatarUrl = null,
                workerRating = 4.6f,
                workerSkills = listOf("برق‌کاری صنعتی و ساختمان"),
                workerExperienceYears = 5,
                employerId = "emp_101",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                salaryToman = 1350000,
                jobDate = "۱۴۰۳/۰۶/۰۵",
                status = ApplicationStatus.PENDING,
                appliedAt = now - 7200000,
                rejectionReason = null
            ),
            JobApplicationEntity(
                id = "app_4",
                jobId = "job_1",
                jobTitle = "برق‌کار صنعتی ماهر برای پروژه اداری",
                workerId = "worker_203",
                workerName = "سعید مرادی",
                workerAvatarUrl = null,
                workerRating = 4.9f,
                workerSkills = listOf("برق‌کاری صنعتی و ساختمان", "جوشکاری و آهنگری"),
                workerExperienceYears = 8,
                employerId = "emp_101",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                salaryToman = 1350000,
                jobDate = "۱۴۰۳/۰۶/۰۵",
                status = ApplicationStatus.PENDING,
                appliedAt = now - 1800000,
                rejectionReason = null
            )
        )
    }

    fun createInitialShifts(): List<ShiftEntity> {
        return listOf(
            ShiftEntity(
                id = "shift_1",
                jobId = "job_1",
                jobTitle = "برق‌کاری تابلو و کابل‌کشی پروژه سعادت‌آباد",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                employerId = "emp_101",
                employerName = "مهندس علیرضا رضایی",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                date = "۱۴۰۳/۰۶/۰۵",
                startTime = "۰۸:۰۰",
                endTime = "۱۷:۰۰",
                location = "تهران، سعادت‌آباد، میدان کاج، خ سرو غربی",
                salaryToman = 1350000,
                status = ShiftStatus.UPCOMING,
                checkInTime = null,
                checkOutTime = null
            ),
            ShiftEntity(
                id = "shift_2",
                jobId = "job_prev",
                jobTitle = "نصب و سیم‌کشی سیستم روشنایی سوله",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                employerId = "emp_104",
                employerName = "مهندس کامران رستمی",
                businessName = "پیمانکاری عمران پایدار",
                date = "۱۴۰۳/۰۶/۰۲",
                startTime = "۰۸:۰۰",
                endTime = "۱۶:۰۰",
                location = "کرج، شهرک صنعتی سیمین دشت",
                salaryToman = 1200000,
                status = ShiftStatus.COMPLETED,
                checkInTime = "۰۸:۰۴",
                checkOutTime = "۱۶:۱۰"
            )
        )
    }

    fun createInitialNotifications(): List<NotificationEntity> {
        val now = System.currentTimeMillis()
        return listOf(
            NotificationEntity(
                id = "notif_1",
                userId = "worker_default",
                title = "کار جدید در نزدیکی شما!",
                message = "یک فرصت شغلی در فاصله ۷۰۰ متری شما (سعادت‌آباد) با تطابق ۹۲٪ ثبت شد.",
                type = NotificationType.JOB_INVITATION,
                timestamp = now - 1800000,
                isRead = false,
                referenceId = "job_1"
            ),
            NotificationEntity(
                id = "notif_2",
                userId = "worker_default",
                title = "درخواست شما پذیرفته شد!",
                message = "شرکت ساختمانی سازه گستر البرز درخواست شما برای آگهی «برق‌کار صنعتی ماهر» را تایید کرد.",
                type = NotificationType.APPLICATION_ACCEPTED,
                timestamp = now - 3600000,
                isRead = false,
                referenceId = "job_1"
            ),
            NotificationEntity(
                id = "notif_3",
                userId = "worker_default",
                title = "یادآوری شیفت فردا",
                message = "شیفت کاری شما فردا ساعت ۰۸:۰۰ در سعادت‌آباد آغاز خواهد شد.",
                type = NotificationType.SHIFT_REMINDER,
                timestamp = now - 7200000,
                isRead = false,
                referenceId = "shift_1"
            )
        )
    }

    fun createDefaultWorkerProfile(userId: String = "worker_default", phone: String = "09123456789"): WorkerProfileEntity {
        return WorkerProfileEntity(
            userId = userId,
            fullName = "محمد حسینی",
            nationalId = "0012345678",
            birthDate = "1372/04/15",
            gender = Gender.MALE,
            avatarUrl = null,
            skills = listOf(skills[7], skills[8]),
            categories = listOf(categories[2]),
            experienceYears = 6,
            city = "تهران",
            address = "تهران، ستارخان، خیابان خسرو شمالی",
            availableDays = listOf("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"),
            availableHours = "۰۸:۰۰ الی ۱۸:۰۰",
            preferredJobs = listOf("برق‌کاری صنعتی", "تاسیسات ساختمانی"),
            rating = 4.8f,
            completedJobsCount = 24,
            isAvailableForWork = true,
            totalEarningsToman = 28500000
        )
    }

    fun createDefaultEmployerProfile(userId: String = "employer_default", phone: String = "09129876543"): EmployerProfileEntity {
        return EmployerProfileEntity(
            userId = userId,
            fullName = "مهندس علیرضا رضایی",
            businessName = "شرکت ساختمانی سازه گستر البرز",
            businessCategory = "پیمانکاری و ساخت‌وساز",
            city = "تهران",
            address = "تهران، سعادت‌آباد، میدان کاج، برج سرو",
            contactInfo = "۰۲۱-۲۲۳۳۴۴۵۵",
            avatarUrl = null,
            isVerified = true,
            rating = 4.9f,
            postedJobsCount = 12,
            activeShiftsCount = 3
        )
    }
}
