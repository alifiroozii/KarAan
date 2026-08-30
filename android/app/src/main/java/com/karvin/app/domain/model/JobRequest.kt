package com.karvin.app.domain.model

data class JobRequest(
    val id: String,
    val title: String,
    val categoryId: String,
    val categoryTitle: String,
    val description: String = "",
    val latitude: Double,
    val longitude: Double,
    val address: String = "",
    val status: JobStatus = JobStatus.OPEN,
    val budget: Long = 0,
    val isUrgent: Boolean = false,
    val requesterName: String? = null,
)

data class CreateJobRequest(
    val title: String,
    val categoryId: String,
    val description: String,
    val latitude: Double,
    val longitude: Double,
    val address: String,
    val budget: Long,
    val isUrgent: Boolean,
)
