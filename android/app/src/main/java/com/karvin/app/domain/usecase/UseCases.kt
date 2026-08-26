package com.karvin.app.domain.usecase

import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.toPersianDigits

class CalculateDistanceUseCase {
    operator fun invoke(from: GeoPoint, to: GeoPoint): Double = DistanceCalculator.distanceInKm(from, to)
}

class FilterJobsUseCase(private val calculateDistance: CalculateDistanceUseCase = CalculateDistanceUseCase()) {
    operator fun invoke(jobs: List<Job>, filter: JobFilter, userPoint: GeoPoint): List<Job> = jobs.filter { job ->
        val distance = calculateDistance(userPoint, job.point)
        val searchMatches = filter.query.isBlank() || listOf(
            job.title,
            job.category.title,
            job.description,
            job.employer.name,
            job.requiredSkills.joinToString(" "),
        ).any { it.contains(filter.query, ignoreCase = true) }
        val categoryMatches = filter.categoryId == null || filter.categoryId == job.category.id
        val amountMatches = (filter.minAmount == null || job.amount >= filter.minAmount) &&
            (filter.maxAmount == null || job.amount <= filter.maxAmount)
        val urgentMatches = !filter.urgentOnly || job.isUrgent
        val ratingMatches = filter.minimumRating == null || job.employer.rating >= filter.minimumRating
        searchMatches && categoryMatches && amountMatches && urgentMatches && ratingMatches &&
            DistanceCalculator.matches(distance, filter.distance)
    }.sortedBy { calculateDistance(userPoint, it.point) }
}

fun JobStatus.label(): String = when (this) {
    JobStatus.OPEN -> "باز"
    JobStatus.APPLIED -> "در انتظار بررسی"
    JobStatus.ACCEPTED -> "پذیرفته شده"
    JobStatus.WORKER_ON_THE_WAY -> "نیرو در مسیر است"
    JobStatus.ARRIVED -> "نیرو رسید"
    JobStatus.IN_PROGRESS -> "در حال انجام"
    JobStatus.COMPLETED -> "تکمیل شده"
    JobStatus.RATED -> "امتیازدهی شده"
    JobStatus.CANCELLED -> "لغو شده"
}

fun DistanceFilter.label(): String = when (this) {
    DistanceFilter.UNDER_ONE -> "زیر ۱ کیلومتر"
    DistanceFilter.UNDER_THREE -> "زیر ۳ کیلومتر"
    DistanceFilter.UNDER_FIVE -> "زیر ۵ کیلومتر"
    DistanceFilter.UNDER_TEN -> "زیر ۱۰ کیلومتر"
    DistanceFilter.ALL -> "همه فاصله‌ها"
}

fun Long.toCompactPrice(): String = when {
    this >= 1_000_000 -> "${(this / 1_000_000.0).let { String.format(java.util.Locale.US, "%.1f", it) }.toPersianDigits()} میلیون"
    this >= 1_000 -> "${(this / 1_000).toPersianDigits()} هزار"
    else -> toString().toPersianDigits()
}
