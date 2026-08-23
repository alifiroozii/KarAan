package com.karvin.app.domain.model

data class JobCategory(
    val id: String,
    val nameFa: String,
    val nameEn: String,
    val iconName: String,
    val jobCount: Int = 0
)
