package com.karvin.app.core.navigation

import com.karvin.app.domain.model.UserRole

object Routes {
    const val Splash = "splash"
    const val Onboarding = "onboarding"
    const val Auth = "auth"
    const val Role = "role"
    const val WorkerHome = "worker/home"
    const val EmployerHome = "employer/home"
    const val WorkerJobs = "worker/jobs"
    const val WorkerApplications = "worker/applications"
    const val EmployerJobs = "employer/jobs"
    const val WorkerMap = "worker/map"
    const val EmployerMap = "employer/map"
    const val Chat = "chat"
    const val Profile = "profile"
    const val Notifications = "notifications"
    const val Settings = "settings"
    const val CreateJob = "employer/create-job"
    const val CreateJobDestination = "employer/create-job?workerId={workerId}"
    const val Applications = "employer/applications/{jobId}"
    const val JobDetails = "job/{jobId}?employerMode={employerMode}"
    const val WorkerDetails = "worker/{workerId}"
    const val Conversation = "conversation/{conversationId}"
    const val Rating = "rating/{targetId}"

    fun jobDetails(id: String, employerMode: Boolean = false) = "job/$id?employerMode=$employerMode"
    fun createJob(workerId: String? = null) = workerId?.let { "employer/create-job?workerId=$it" } ?: CreateJob
    fun workerDetails(id: String) = "worker/$id"
    fun applications(id: String) = "employer/applications/$id"
    fun conversation(id: String) = "conversation/$id"
    fun rating(id: String) = "rating/$id"
}

data class BottomDestination(val route: String, val title: String, val icon: String)

fun bottomDestinations(role: UserRole): List<BottomDestination> = if (role == UserRole.WORKER) {
    listOf(
        BottomDestination(Routes.WorkerHome, "خانه", "⌂"),
        BottomDestination(Routes.WorkerJobs, "کارها", "▣"),
        BottomDestination(Routes.WorkerMap, "نقشه", "⌖"),
        BottomDestination(Routes.Chat, "پیام‌ها", "◌"),
        BottomDestination(Routes.Profile, "پروفایل", "♙"),
    )
} else {
    listOf(
        BottomDestination(Routes.EmployerHome, "خانه", "⌂"),
        BottomDestination(Routes.EmployerJobs, "درخواست‌ها", "▣"),
        BottomDestination(Routes.EmployerMap, "نقشه نیروها", "⌖"),
        BottomDestination(Routes.Chat, "پیام‌ها", "◌"),
        BottomDestination(Routes.Profile, "پروفایل", "♙"),
    )
}
