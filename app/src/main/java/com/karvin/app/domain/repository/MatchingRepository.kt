package com.karvin.app.domain.repository

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.MatchResult
import com.karvin.app.domain.model.WorkerProfile

interface MatchingRepository {
    fun calculateJobWorkerMatch(job: Job, worker: WorkerProfile, userLocation: LocationPoint? = null): MatchResult
    fun rankJobsForWorker(jobs: List<Job>, worker: WorkerProfile, userLocation: LocationPoint? = null): List<Job>
    fun rankWorkersForJob(workers: List<WorkerProfile>, job: Job, employerLocation: LocationPoint? = null): List<WorkerProfile>
}
