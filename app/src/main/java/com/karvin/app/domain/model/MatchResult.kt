package com.karvin.app.domain.model

data class MatchResult(
    val scorePercentage: Int, // e.g. 92
    val distanceScore: Float, // 0.0 - 1.0 (weight 40%)
    val skillMatchScore: Float, // 0.0 - 1.0 (weight 30%)
    val ratingScore: Float, // 0.0 - 1.0 (weight 20%)
    val availabilityScore: Float, // 0.0 - 1.0 (weight 10%)
    val matchedSkills: List<String> = emptyList(),
    val distanceMeters: Int = 0,
    val distanceTextFa: String = ""
) {
    val isHighMatch: Boolean get() = scorePercentage >= 80
    val isMediumMatch: Boolean get() = scorePercentage in 60..79
    val matchBadgeTextFa: String get() = "$scorePercentage٪ تطابق هوشمند"
}
