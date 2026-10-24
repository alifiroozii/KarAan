package com.karvin.app.core.navigation

object Routes {
    // Entry & Auth
    const val Splash = "splash"
    const val Onboarding = "onboarding"
    const val ModeSelection = "mode_selection"
    const val Login = "auth/login?role={role}"
    const val Otp = "auth/otp?phone={phone}"

    // Requester flow
    const val RequesterLocationExplanation = "requester/location_explanation"
    const val RequesterHome = "requester/home"
    const val RequesterMap = "requester/map"
    const val RequesterJobs = "requester/jobs"
    const val RequestSent = "request/sent?provider={provider}"

    // Performer flow — renamed from "provider" in the UI, internal ids unchanged.
    const val PerformerLocationExplanation = "provider/location_explanation"
    const val PerformerHome = "provider/home"
    const val PerformerSearch = "provider/search"
    const val PerformerMap = "provider/map"
    const val PerformerJobs = "provider/jobs"
    const val CreateService = "provider/create-service"
    const val ProviderWorkArea = "provider/work-area"
    const val AvailabilityDeclared = "provider/availability_declared"

    // Role switching
    const val RoleSwitch = "role/switch"

    // Five-step job creation flow
    const val CreateJobStep1 = "create-job/step/1"
    const val CreateJobStep2 = "create-job/step/2"
    const val CreateJobStep3 = "create-job/step/3"
    const val CreateJobStep4 = "create-job/step/4"
    const val CreateJobStep5 = "create-job/step/5"
    const val JobPublished = "create-job/published/{jobId}"

    // Aliases so the pre-KARJOOR route names still resolve at call sites.
    const val ProviderHome = PerformerHome
    const val ProviderJobs = PerformerJobs
    const val ProviderMap = PerformerMap
    const val ProviderLocationExplanation = PerformerLocationExplanation

    // Shared
    const val ProviderProfile = "provider_profile/{providerId}"
    const val Chat = "chat"
    const val Profile = "profile"
    const val EditProfile = "profile/edit"
    const val Notifications = "notifications"
    const val Settings = "settings"
    const val Wallet = "wallet"

    const val WorkArea = ProviderWorkArea
    const val CreateJob = "employer/create-job"
    const val CreateJobDestination = "employer/create-job?workerId={workerId}"
    const val LocationPicker = "map/location-picker"
    const val Applications = "employer/applications/{jobId}"
    const val JobDetails = "job/{jobId}?employerMode={employerMode}"
    const val WorkerDetails = "worker/{workerId}"
    const val Conversation = "conversation/{conversationId}"
    const val Rating = "rating/{targetId}"

    fun login(role: String? = null) = if (role != null) "auth/login?role=$role" else "auth/login?role=REQUESTER"
    fun otp(phone: String) = "auth/otp?phone=$phone"
    fun wallet() = Wallet
    fun jobDetails(id: String, employerMode: Boolean = false) = "job/$id?employerMode=$employerMode"
    fun requestSent(provider: Boolean = false) = "request/sent?provider=$provider"
    fun createJob(workerId: String? = null) = workerId?.let { "employer/create-job?workerId=$it" } ?: CreateJob
    fun workerDetails(id: String) = providerProfile(id)
    fun providerProfile(id: String) = "provider_profile/$id"
    fun applications(id: String) = "employer/applications/$id"
    fun conversation(id: String) = "conversation/$id"
    fun rating(id: String) = "rating/$id"

    /** Five-step flow step builders. */
    fun createJobStep(step: Int) = "create-job/step/$step"
    fun jobPublished(jobId: String) = "create-job/published/$jobId"
}

data class BottomDestination(val route: String, val title: String)

/**
 * Requester (درخواست‌دهنده) bottom navigation.
 *
 * Order matches RTL reading: خانه، درخواست‌ها، ثبت کار، پیام‌ها، حساب من. The
 * "ثبت کار" entry is a real destination — tapping it opens the five-step job
 * form — not a decorative FAB, so keyboard and screen-reader navigation both
 * reach it.
 */
fun requesterBottomDestinations(): List<BottomDestination> = listOf(
    BottomDestination(Routes.RequesterHome, "خانه"),
    BottomDestination(Routes.RequesterJobs, "درخواست‌ها"),
    BottomDestination(Routes.CreateJob, "ثبت کار"),
    BottomDestination(Routes.Chat, "پیام‌ها"),
    BottomDestination(Routes.Profile, "حساب من"),
)

/**
 * Performer (انجام‌دهنده) bottom navigation.
 *
 * Order: خانه، جست‌وجو، کارهای من، پیام‌ها، حساب من. Search is a first-class tab
 * because discovering work is the Performer's core loop.
 */
fun performerBottomDestinations(): List<BottomDestination> = listOf(
    BottomDestination(Routes.PerformerHome, "خانه"),
    BottomDestination(Routes.PerformerSearch, "جست‌وجو"),
    BottomDestination(Routes.PerformerJobs, "کارهای من"),
    BottomDestination(Routes.Chat, "پیام‌ها"),
    BottomDestination(Routes.Profile, "حساب من"),
)

/** Backwards-compatible aliases for the previous route naming. */
fun providerHomeDestinations(): List<BottomDestination> = performerBottomDestinations()
fun providerBottomDestinations(): List<BottomDestination> = performerBottomDestinations()



