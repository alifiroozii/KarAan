package com.karvin.app.data.repository

import com.karvin.app.data.location.DistanceCalculator
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.MatchResult
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.MatchingRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MatchingRepositoryImpl @Inject constructor() : MatchingRepository {

    override fun calculateJobWorkerMatch(
        job: Job,
        worker: WorkerProfile,
        userLocation: LocationPoint?
    ): MatchResult {
        // 1. Distance Calculation (40% weight)
        val jobLat = job.latitude ?: LocationPoint.DEFAULT_TEHRAN.latitude
        val jobLon = job.longitude ?: LocationPoint.DEFAULT_TEHRAN.longitude
        val workerLat = userLocation?.latitude ?: worker.latitude ?: LocationPoint.DEFAULT_TEHRAN.latitude
        val workerLon = userLocation?.longitude ?: worker.longitude ?: LocationPoint.DEFAULT_TEHRAN.longitude

        val distanceMeters = DistanceCalculator.calculateDistanceMeters(jobLat, jobLon, workerLat, workerLon)
        val distanceTextFa = DistanceCalculator.formatDistanceFa(distanceMeters)

        val distanceScore = when {
            distanceMeters <= 800 -> 1.0f
            distanceMeters <= 2000 -> 0.90f
            distanceMeters <= 5000 -> 0.75f
            distanceMeters <= 10000 -> 0.55f
            distanceMeters <= 20000 -> 0.35f
            else -> 0.20f
        }

        // 2. Skill Match Calculation (30% weight)
        val workerSkillNames = worker.skills.map { it.nameFa.lowercase().trim() }
        val requiredSkills = job.requiredSkills.map { it.lowercase().trim() }

        val matched = if (requiredSkills.isNotEmpty()) {
            requiredSkills.filter { req ->
                workerSkillNames.any { it.contains(req) || req.contains(it) }
            }
        } else {
            emptyList()
        }

        val skillMatchScore = if (requiredSkills.isNotEmpty()) {
            (matched.size.toFloat() / requiredSkills.size.toFloat()).coerceIn(0.2f, 1.0f)
        } else {
            0.85f // If no explicit skills required, general match
        }

        // 3. Rating Score (20% weight)
        val ratingScore = (worker.rating / 5.0f).coerceIn(0.5f, 1.0f)

        // 4. Availability Score (10% weight)
        val availabilityScore = if (worker.isAvailableNow && worker.isAvailableForWork) 1.0f else 0.5f

        val totalPercentage = (
            (distanceScore * 40f) +
            (skillMatchScore * 30f) +
            (ratingScore * 20f) +
            (availabilityScore * 10f)
        ).toInt().coerceIn(45, 99)

        return MatchResult(
            scorePercentage = totalPercentage,
            distanceScore = distanceScore,
            skillMatchScore = skillMatchScore,
            ratingScore = ratingScore,
            availabilityScore = availabilityScore,
            matchedSkills = matched,
            distanceMeters = distanceMeters,
            distanceTextFa = distanceTextFa
        )
    }

    override fun rankJobsForWorker(
        jobs: List<Job>,
        worker: WorkerProfile,
        userLocation: LocationPoint?
    ): List<Job> {
        return jobs.map { job ->
            val match = calculateJobWorkerMatch(job, worker, userLocation)
            job.copy(
                distanceMeters = match.distanceMeters,
                distanceTextFa = match.distanceTextFa,
                matchScorePercentage = match.scorePercentage
            )
        }.sortedByDescending { it.matchScorePercentage ?: 0 }
    }

    override fun rankWorkersForJob(
        workers: List<WorkerProfile>,
        job: Job,
        employerLocation: LocationPoint?
    ): List<WorkerProfile> {
        return workers.map { worker ->
            val match = calculateJobWorkerMatch(job, worker, employerLocation)
            worker.copy(
                distanceMeters = match.distanceMeters,
                distanceTextFa = match.distanceTextFa,
                matchScorePercentage = match.scorePercentage
            )
        }.sortedByDescending { it.matchScorePercentage ?: 0 }
    }
}
