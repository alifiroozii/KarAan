package com.karvin.app.domain.model

data class Rating(
    val id: String,
    val raterId: String,
    val raterName: String,
    val targetUserId: String,
    val jobId: String,
    val score: Float,
    val comment: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
