package com.karvin.app.domain.repository

import com.karvin.app.domain.model.AppNotification
import com.karvin.app.domain.model.Application
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.Conversation
import com.karvin.app.domain.model.CreateJobInput
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.RatingInput
import com.karvin.app.domain.model.Review
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerFilter
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val currentUser: Flow<User?>
    val selectedRole: Flow<UserRole?>
    suspend fun signIn(phone: String): AppResult<User>
    suspend fun setRole(role: UserRole): AppResult<Unit>
    suspend fun updateProfile(user: User): AppResult<User>
    suspend fun signOut()
}

interface JobRepository {
    fun observeJobs(filter: JobFilter = JobFilter(), userPoint: GeoPoint): Flow<AppResult<List<Job>>>
    fun observeJob(jobId: String): Flow<AppResult<Job>>
    fun observeApplications(jobId: String): Flow<AppResult<List<Application>>>
    suspend fun acceptApplication(applicationId: String): AppResult<Application>
    suspend fun applyToJob(jobId: String, message: String): AppResult<Application>
    suspend fun createJob(input: CreateJobInput): AppResult<Job>
    suspend fun updateJobStatus(jobId: String, status: com.karvin.app.domain.model.JobStatus): AppResult<Job>
    suspend fun toggleSaved(jobId: String): AppResult<Boolean>
    fun observeMyApplications(): Flow<AppResult<List<Application>>>
    fun observeMyJobs(): Flow<AppResult<List<Job>>>
}

interface WorkerRepository {
    fun observeWorkers(filter: WorkerFilter = WorkerFilter(), userPoint: GeoPoint): Flow<AppResult<List<User>>>
    fun observeWorker(workerId: String): Flow<AppResult<User>>
    fun observeReviews(workerId: String): Flow<AppResult<List<Review>>>
    suspend fun toggleAvailability(isAvailable: Boolean): AppResult<User>
    suspend fun toggleFavorite(workerId: String): AppResult<Boolean>
    suspend fun inviteWorker(workerId: String, jobId: String): AppResult<Unit>
    suspend fun rateWorker(input: RatingInput): AppResult<Review>
}

interface ChatRepository {
    fun observeConversations(): Flow<AppResult<List<Conversation>>>
    fun observeMessages(conversationId: String): Flow<AppResult<List<ChatMessage>>>
    suspend fun sendMessage(conversationId: String, text: String): AppResult<ChatMessage>
}

interface NotificationRepository {
    fun observeNotifications(): Flow<AppResult<List<AppNotification>>>
    suspend fun markAsRead(notificationId: String): AppResult<Unit>
    suspend fun markAllAsRead(): AppResult<Unit>
}

interface UserPreferencesRepository {
    val onboardingCompleted: Flow<Boolean>
    val themeMode: Flow<String>
    suspend fun setOnboardingCompleted(completed: Boolean)
    suspend fun setThemeMode(mode: String)
}
