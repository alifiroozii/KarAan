package com.karvin.app.data.repository

import com.karvin.app.data.local.entity.EmployerProfileEntity
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.local.entity.JobEntity
import com.karvin.app.data.local.entity.NotificationEntity
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.local.entity.WorkerProfileEntity
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.UserRole
import java.util.UUID

object FakeDataGenerator {

    val categories = listOf(
        JobCategory(id = "cat_1", nameFa = "ساختمان و عمران", nameEn = "Construction", iconName = "construction", jobCount = 14),
        JobCategory(id = "cat_2", nameFa = "انبارداری و لجستیک", nameEn = "Logistics", iconName = "inventory", jobCount = 9),
        JobCategory(id = "cat_3", nameFa = "فنی و تاسیسات", nameEn = "Technical Services", iconName = "build", jobCount = 12),
        JobCategory(id = "cat_4", nameFa = "رستوران و تشریفات", nameEn = "Hospitality", iconName = "restaurant", jobCount = 18),
        JobCategory(id = "cat_5", nameFa = "نظافت و بهداشت", nameEn = "Cleaning", iconName = "cleaning_services", jobCount = 7),
        JobCategory(id = "cat_6", nameFa = "حمل و نقل و جابجایی", nameEn = "Transport", iconName = "local_shipping", jobCount = 11),
        JobCategory(id = "cat_7", nameFa = "کشاورزی و باغبانی", nameEn = "Gardening", iconName = "yard", jobCount = 5)
    )

    val skills = listOf(
        Skill(id = "sk_1", nameFa = "بنایی و سیمان‌کاری", nameEn = "Masonry", categoryId = "cat_1"),
        Skill(id = "sk_2", nameFa = "نقاشی ساختمان", nameEn = "Painting", categoryId = "cat_1"),
        Skill(id = "sk_3", nameFa = "گچ‌کاری و کناف", nameEn = "Plastering", categoryId = "cat_1"),
        Skill(id = "sk_4", nameFa = "بسته‌بندی و بارچینی", nameEn = "Packing", categoryId = "cat_2"),
        Skill(id = "sk_5", nameFa = "رانندگی لیفتراک", nameEn = "Forklift", categoryId = "cat_2"),
        Skill(id = "sk_6", nameFa = "برق‌کاری ساختمان و صنعتی", nameEn = "Electrician", categoryId = "cat_3"),
        Skill(id = "sk_7", nameFa = "لوله‌کشی و تاسیسات", nameEn = "Plumbing", categoryId = "cat_3"),
        Skill(id = "sk_8", nameFa = "جوشکاری برق و گاز", nameEn = "Welding", categoryId = "cat_3"),
        Skill(id = "sk_9", nameFa = "کمک‌آشپز و تخته‌کار", nameEn = "Kitchen Prep", categoryId = "cat_4"),
        Skill(id = "sk_10", nameFa = "سالن‌داری و ویتر", nameEn = "Waiter", categoryId = "cat_4"),
        Skill(id = "sk_11", nameFa = "باریستا و بارتندر", nameEn = "Barista", categoryId = "cat_4"),
        Skill(id = "sk_12", nameFa = "نظافت صنعتی و ساختمانی", nameEn = "Industrial Cleaning", categoryId = "cat_5"),
        Skill(id = "sk_13", nameFa = "جابجایی اثاثیه و باربری", nameEn = "Moving", categoryId = "cat_6")
    )

    fun createInitialJobs(): List<JobEntity> {
        val now = System.currentTimeMillis()
        return listOf(
            JobEntity(
                id = "job_1",
                employerId = "emp_101",
                employerName = "مهندس علیرضا رضایی",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                title = "نیازمند ۲ نفر برق‌کار صنعتی ماهر برای پروژه اداری",
                description = "برای کابل‌کشی، نصب تابلوهای برق فرعی و روشنایی پروژه ۵ طبقه تجاری اداری در محدوده سعادت‌آباد تهران نیازمند نیروی مجرب با سابقه کاری هستیم. ناهار و تجهیزات ایمنی فراهم است.",
                categoryId = "cat_3",
                categoryName = "فنی و تاسیسات",
                numberOfWorkersNeeded = 2,
                currentWorkersCount = 0,
                date = "۱۴۰۳/۰۶/۰۵",
                startTime = "۰۸:۰۰",
                endTime = "۱۷:۰۰",
                salaryToman = 1350000,
                isHourlySalary = false,
                city = "تهران",
                address = "تهران، سعادت‌آباد، میدان کاج، خیابان سرو غربی",
                latitude = 35.7836,
                longitude = 51.3789,
                requiredSkills = listOf("برق‌کاری ساختمان و صنعتی", "لوله‌کشی و تاسیسات"),
                status = JobStatus.OPEN,
                createdAt = now - 3600000,
                isUrgent = true,
                hasApplied = false
            ),
            JobEntity(
                id = "job_2",
                employerId = "emp_102",
                employerName = "حاج حسین میرزایی",
                businessName = "مجتمع لجستیک پخش آریا",
                title = "نیروی انباردار و بارچین فوری شیفت عصر",
                description = "تخلیه بار خاور و چیدمان پالت‌های دارویی و بهداشتی در قفسه‌های مرکزی. پرداخت نقدی و تسویه در پایان شیفت کاری.",
                categoryId = "cat_2",
                categoryName = "انبارداری و لجستیک",
                numberOfWorkersNeeded = 4,
                currentWorkersCount = 1,
                date = "۱۴۰۳/۰۶/۰۴",
                startTime = "۱۴:۰۰",
                endTime = "۲۲:۰۰",
                salaryToman = 950000,
                isHourlySalary = false,
                city = "تهران",
                address = "تهران، جاده مخصوص کرج، کیلومتر ۱۴، جنب انبار مرکزی",
                latitude = 35.7001,
                longitude = 51.1892,
                requiredSkills = listOf("بسته‌بندی و بارچینی"),
                status = JobStatus.OPEN,
                createdAt = now - 7200000,
                isUrgent = true,
                hasApplied = false
            ),
            JobEntity(
                id = "job_3",
                employerId = "emp_103",
                employerName = "سرکار خانم صادقی",
                businessName = "کافه رستوران نارنجستان",
                title = "ویتر و سالن‌دار شیفت شب آخر هفته",
                description = "پذیرایی و میزبانی از مشتریان در شیفت پرتردد، خوش‌برخورد با ظاهر آراسته و روابط عمومی بالا. شام و هزینه ایاب و ذهاب برگشت تامین می‌شود.",
                categoryId = "cat_4",
                categoryName = "رستوران و تشریفات",
                numberOfWorkersNeeded = 3,
                currentWorkersCount = 2,
                date = "۱۴۰۳/۰۶/۰۶",
                startTime = "۱۷:۳۰",
                endTime = "۰۰:۳۰",
                salaryToman = 850000,
                isHourlySalary = false,
                city = "تهران",
                address = "تهران، نیاوران، خیابان باهنر، پلاک ۷۲",
                latitude = 35.8123,
                longitude = 51.4678,
                requiredSkills = listOf("سالن‌داری و ویتر"),
                status = JobStatus.OPEN,
                createdAt = now - 14400000,
                isUrgent = false,
                hasApplied = false
            ),
            JobEntity(
                id = "job_4",
                employerId = "emp_104",
                employerName = "مهندس کامران رستمی",
                businessName = "پیمانکاری عمران پایدار",
                title = "۳ نفر استادکار بنا و دیوارچین بلوک هبلکس",
                description = "دیوارچینی پیرامونی اسکلت بتنی با ملات چسب مخصوص هبلکس. ابزار کار از کارگاه تحویل داده می‌شود.",
                categoryId = "cat_1",
                categoryName = "ساختمان و عمران",
                numberOfWorkersNeeded = 3,
                currentWorkersCount = 0,
                date = "۱۴۰۳/۰۶/۰۷",
                startTime = "۰۷:۳۰",
                endTime = "۱۶:۳۰",
                salaryToman = 1500000,
                isHourlySalary = false,
                city = "کرج",
                address = "کرج، مهرشهر، بلوار ارم، خیابان ۱۰۰",
                latitude = 35.8021,
                longitude = 50.9123,
                requiredSkills = listOf("بنایی و سیمان‌کاری"),
                status = JobStatus.OPEN,
                createdAt = now - 28800000,
                isUrgent = false,
                hasApplied = false
            ),
            JobEntity(
                id = "job_5",
                employerId = "emp_105",
                employerName = "آقای بهروز اکبری",
                businessName = "باربری و حمل‌ونقل نگین پایتخت",
                title = "کارگر ماهر تخلیه و بارگیری اثاثیه منزل",
                description = "حمل وسایل سنگین شامل یخچال ساید، گاوصندوق و پیانو با رعایت اصول ایمنی و پتوپیچی اثاثیه.",
                categoryId = "cat_6",
                categoryName = "حمل و نقل و جابجایی",
                numberOfWorkersNeeded = 4,
                currentWorkersCount = 1,
                date = "۱۴۰۳/۰۶/۰۵",
                startTime = "۰۹:۰۰",
                endTime = "۱۵:۰۰",
                salaryToman = 1100000,
                isHourlySalary = false,
                city = "تهران",
                address = "تهران، یوسف‌آباد، خیابان جهان‌آرا",
                latitude = 35.7312,
                longitude = 51.4056,
                requiredSkills = listOf("جابجایی اثاثیه و باربری"),
                status = JobStatus.OPEN,
                createdAt = now - 43200000,
                isUrgent = true,
                hasApplied = false
            ),
            JobEntity(
                id = "job_6",
                employerId = "emp_101",
                employerName = "مهندس علیرضا رضایی",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                title = "نقاش ماهر کناف و رنگ روغن پروژه نمایشگاهی",
                description = "بتونه‌کاری درزگیر کناف و اجرای ۲ دست رنگ نیم‌پلاستیک و اکریلیک با پیستوله و غلطک.",
                categoryId = "cat_1",
                categoryName = "ساختمان و عمران",
                numberOfWorkersNeeded = 2,
                currentWorkersCount = 0,
                date = "۱۴۰۳/۰۶/۰۸",
                startTime = "۰۸:۰۰",
                endTime = "۱۸:۰۰",
                salaryToman = 1400000,
                isHourlySalary = false,
                city = "تهران",
                address = "تهران، بزرگراه چمران، محل دائمی نمایشگاه‌های بین‌المللی",
                latitude = 35.7912,
                longitude = 51.4111,
                requiredSkills = listOf("نقاشی ساختمان", "گچ‌کاری و کناف"),
                status = JobStatus.OPEN,
                createdAt = now - 86400000,
                isUrgent = false,
                hasApplied = false
            )
        )
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
                workerSkills = listOf("برق‌کاری ساختمان و صنعتی", "لوله‌کشی و تاسیسات"),
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
                workerSkills = listOf("برق‌کاری ساختمان و صنعتی"),
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
                workerSkills = listOf("برق‌کاری ساختمان و صنعتی", "جوشکاری برق و گاز"),
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
                title = "درخواست شما پذیرفته شد!",
                message = "شرکت ساختمانی سازه گستر البرز درخواست شما برای آگهی «برق‌کار صنعتی ماهر» را تایید کرد.",
                type = NotificationType.APPLICATION_ACCEPTED,
                timestamp = now - 3600000,
                isRead = false,
                referenceId = "job_1"
            ),
            NotificationEntity(
                id = "notif_2",
                userId = "worker_default",
                title = "یادآوری شیفت فردا",
                message = "شیفت کاری شما فردا ساعت ۰۸:۰۰ در سعادت‌آباد آغاز خواهد شد.",
                type = NotificationType.SHIFT_REMINDER,
                timestamp = now - 7200000,
                isRead = false,
                referenceId = "shift_1"
            ),
            NotificationEntity(
                id = "notif_3",
                userId = "worker_default",
                title = "واریز دستمزد شیفت",
                message = "مبلغ ۱,۲۰۰,۰۰۰ تومان بابت شیفت شهرک صنعتی سیمین دشت به حساب شما منظور شد.",
                type = NotificationType.PAYMENT_RECEIVED,
                timestamp = now - 86400000,
                isRead = true,
                referenceId = "shift_2"
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
            skills = listOf(skills[5], skills[6]),
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
