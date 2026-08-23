package com.karvin.app.presentation.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object RoleSelection : Screen("role_selection")
    object Login : Screen("login?role={role}") {
        fun createRoute(role: String) = "login?role=$role"
    }
    object OtpVerification : Screen("otp_verification?phone={phone}&role={role}") {
        fun createRoute(phone: String, role: String) = "otp_verification?phone=$phone&role=$role"
    }
    object WorkerRegister : Screen("worker_register")
    object EmployerRegister : Screen("employer_register")

    // Worker Flows
    object WorkerMain : Screen("worker_main")
    object WorkerHome : Screen("worker_home")
    object WorkerMap : Screen("worker_map")
    object WorkerJobs : Screen("worker_jobs")
    object WorkerShifts : Screen("worker_shifts")
    object WorkerChat : Screen("worker_chat")
    object WorkerProfile : Screen("worker_profile")
    object WorkerWallet : Screen("worker_wallet")
    object ActiveShift : Screen("active_shift")

    // Employer Flows
    object EmployerMain : Screen("employer_main")
    object EmployerDashboard : Screen("employer_dashboard")
    object EmployerMap : Screen("employer_map")
    object CreateJob : Screen("create_job")
    object EmployerApplicants : Screen("employer_applicants")
    object EmployerShifts : Screen("employer_shifts")
    object EmployerChat : Screen("employer_chat")
    object EmployerProfile : Screen("employer_profile")
    object EmployerPayment : Screen("employer_payment")

    // Shared Screens
    object JobDetails : Screen("job_details/{jobId}") {
        fun createRoute(jobId: String) = "job_details/$jobId"
    }
    object ChatDetail : Screen("chat_detail/{conversationId}") {
        fun createRoute(conversationId: String) = "chat_detail/$conversationId"
    }
    object Notifications : Screen("notifications")
    object Settings : Screen("settings")
    object EditProfile : Screen("edit_profile")
}
