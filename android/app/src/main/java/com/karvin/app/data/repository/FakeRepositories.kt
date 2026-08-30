package com.karvin.app.data.repository

import com.karvin.app.data.FakeData
import com.karvin.app.data.PreferencesStore
import com.karvin.app.data.database.CachedJobEntity
import com.karvin.app.data.database.CachedMessageEntity
import com.karvin.app.data.database.CachedWorkerEntity
import com.karvin.app.data.database.FavoriteEntity
import com.karvin.app.data.database.KarvinDao
import com.karvin.app.domain.model.AppNotification
import com.karvin.app.domain.model.Application
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.Conversation
import com.karvin.app.domain.model.CreateJobInput
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.RatingInput
import com.karvin.app.domain.model.Review
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerFilter
import com.karvin.app.domain.model.newId
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.SupervisorJob
import java.time.LocalDateTime

class FakeRepositoryStore(private val dao: KarvinDao? = null) {
    val jobs = MutableStateFlow(FakeData.jobs)
    val workers = MutableStateFlow(FakeData.workers)
    val applications = MutableStateFlow(FakeData.applications)
    val messages = MutableStateFlow(FakeData.messages)
    val notifications = MutableStateFlow(FakeData.notifications)
    val savedJobs = MutableStateFlow<Set<String>>(emptySet())
    val favoriteWorkers = MutableStateFlow<Set<String>>(emptySet())
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun cacheJobs(items: List<Job>) {
        scope.launch {
            dao?.upsertJobs(items.map { job ->
                CachedJobEntity(
                    id = job.id,
                    title = job.title,
                    category = job.category.title,
                    amount = job.amount,
                    latitude = job.point.latitude,
                    longitude = job.point.longitude,
                    payload = job.description,
                )
            })
        }
    }

    fun cacheWorkers(items: List<User>) {
        scope.launch {
            dao?.upsertWorkers(items.map { worker ->
                CachedWorkerEntity(
                    id = worker.id,
                    name = worker.name,
                    skillSummary = worker.skills.joinToString("، "),
                    rating = worker.rating,
                    latitude = worker.point.latitude,
                    longitude = worker.point.longitude,
                    payload = worker.bio,
                )
            })
        }
    }

    fun cacheMessages(items: List<ChatMessage>) {
        scope.launch {
            dao?.upsertMessages(items.map { message ->
                CachedMessageEntity(
                    id = message.id,
                    conversationId = message.conversationId,
                    senderId = message.senderId,
                    text = message.text,
                    sentAt = message.sentAt.toEpochSecond(java.time.ZoneOffset.UTC),
                    isSeen = message.isSeen,
                )
            })
        }
    }

    suspend fun setFavorite(type: String, targetId: String, enabled: Boolean) {
        if (enabled) dao?.upsertFavorite(FavoriteEntity(newId("favorite"), type, targetId))
        else dao?.deleteFavorite(type, targetId)
    }
}

class FakeAuthRepository(private val preferences: PreferencesStore) : AuthRepository {
    override val selectedRole: Flow<UserRole?> = preferences.role
    override val currentUser: Flow<User?> = combine(preferences.isAuthenticated, preferences.role) { authenticated, role ->
        if (!authenticated) null else when (role) {
            UserRole.PROVIDER -> FakeData.workers.first()
            UserRole.REQUESTER -> FakeData.employers.first()
            null -> null
        }
    }

    override suspend fun signIn(phone: String): AppResult<User> {
        preferences.setAuthenticated(true)
        return AppResult.Success(FakeData.workers.first().copy(phone = phone))
    }

    override suspend fun setRole(role: UserRole): AppResult<Unit> {
        preferences.setRole(role)
        return AppResult.Success(Unit)
    }

    override suspend fun signOut() {
        preferences.setAuthenticated(false)
        preferences.setRole(null)
    }
}

class FakeJobRepository(
    private val store: FakeRepositoryStore,
) : JobRepository {
    private val filterJobs = com.karvin.app.domain.usecase.FilterJobsUseCase()

    override fun observeJobs(filter: JobFilter, userPoint: GeoPoint): Flow<AppResult<List<Job>>> = combine(
        store.jobs,
        store.savedJobs,
    ) { jobs, saved ->
        val enriched = jobs.map { it.copy(isSaved = it.id in saved) }
        store.cacheJobs(enriched)
        AppResult.Success(filterJobs(enriched, filter, userPoint))
    }

    override fun observeJob(jobId: String): Flow<AppResult<Job>> = combine(store.jobs, store.savedJobs) { jobs, saved ->
        jobs.firstOrNull { it.id == jobId }?.let { AppResult.Success(it.copy(isSaved = jobId in saved)) }
            ?: AppResult.Error("درخواست کار پیدا نشد")
    }

    override fun observeApplications(jobId: String): Flow<AppResult<List<Application>>> = store.applications.map { items ->
        AppResult.Success(items.filter { it.jobId == jobId })
    }

    override suspend fun acceptApplication(applicationId: String): AppResult<Application> {
        val application = store.applications.value.firstOrNull { it.id == applicationId }
            ?: return AppResult.Error("درخواست همکاری پیدا نشد")
        val accepted = application.copy(status = ApplicationStatus.ACCEPTED)
        store.applications.value = store.applications.value.map { item ->
            when {
                item.id == applicationId -> accepted
                item.jobId == application.jobId && item.status == ApplicationStatus.PENDING -> item.copy(status = ApplicationStatus.REJECTED)
                else -> item
            }
        }
        updateJobStatus(application.jobId, JobStatus.ACCEPTED)
        return AppResult.Success(accepted)
    }

    override suspend fun applyToJob(jobId: String, message: String): AppResult<Application> {
        val worker = FakeData.workers.first()
        val existing = store.applications.value.firstOrNull { it.jobId == jobId && it.worker.id == worker.id }
        if (existing != null) return AppResult.Success(existing)
        val application = Application(newId("application"), jobId, worker, ApplicationStatus.PENDING, LocalDateTime.now(), message)
        store.applications.value = store.applications.value + application
        val job = store.jobs.value.firstOrNull { it.id == jobId }
        if (job?.status == JobStatus.OPEN) {
            store.jobs.value = store.jobs.value.map { if (it.id == jobId) it.copy(status = JobStatus.APPLIED, applicantCount = it.applicantCount + 1) else it }
        }
        return AppResult.Success(application)
    }

    override suspend fun createJob(input: CreateJobInput): AppResult<Job> {
        val employer = FakeData.employers.first()
        val job = Job(
            id = newId("job"),
            title = input.title,
            category = input.category,
            description = input.description,
            employer = employer,
            requiredWorkers = input.requiredWorkers,
            genderRequirement = input.genderRequirement,
            date = input.date,
            startTime = input.startTime,
            durationHours = input.durationHours,
            amount = input.amount,
            paymentType = input.paymentType,
            address = input.address,
            point = input.point,
            isUrgent = input.isUrgent,
            requiredSkills = input.requiredSkills,
        )
        store.jobs.value = listOf(job) + store.jobs.value
        return AppResult.Success(job)
    }

    override suspend fun updateJobStatus(jobId: String, status: JobStatus): AppResult<Job> {
        val updated = store.jobs.value.map { if (it.id == jobId) it.copy(status = status) else it }
        store.jobs.value = updated
        return updated.firstOrNull { it.id == jobId }?.let { AppResult.Success(it) }
            ?: AppResult.Error("درخواست کار پیدا نشد")
    }

    override suspend fun toggleSaved(jobId: String): AppResult<Boolean> {
        val enabled = jobId !in store.savedJobs.value
        store.savedJobs.value = if (enabled) store.savedJobs.value + jobId else store.savedJobs.value - jobId
        store.setFavorite("job", jobId, enabled)
        return AppResult.Success(enabled)
    }

    override fun observeMyApplications(): Flow<AppResult<List<Application>>> = store.applications.map { items ->
        AppResult.Success(items.filter { it.worker.id == FakeData.workers.first().id })
    }

    override fun observeMyJobs(): Flow<AppResult<List<Job>>> = store.jobs.map { items ->
        AppResult.Success(items.filter { it.employer.id == FakeData.employers.first().id })
    }
}

class FakeWorkerRepository(private val store: FakeRepositoryStore) : WorkerRepository {
    override fun observeWorkers(filter: WorkerFilter, userPoint: GeoPoint): Flow<AppResult<List<User>>> = store.workers.map { workers ->
        store.cacheWorkers(workers)
        val result = workers.filter { worker ->
            val searchMatches = filter.query.isBlank() || listOf(worker.name, worker.bio, worker.skills.joinToString(" "))
                .any { it.contains(filter.query, ignoreCase = true) }
            val categoryMatches = filter.categoryId == null || worker.skills.any { it == FakeData.categories.firstOrNull { category -> category.id == filter.categoryId }?.title }
            val ratingMatches = filter.minimumRating == null || worker.rating >= filter.minimumRating
            val onlineMatches = !filter.onlineOnly || worker.isAvailable
            val verifiedMatches = !filter.verifiedOnly || worker.isVerified
            val serviceMatches = filter.service == null || worker.services.any { it.contains(filter.service) }
            val distanceMatches = com.karvin.app.domain.model.DistanceCalculator.matches(
                com.karvin.app.domain.model.DistanceCalculator.distanceInKm(userPoint, worker.point),
                filter.distance,
            )
            searchMatches && categoryMatches && ratingMatches && onlineMatches && verifiedMatches && serviceMatches && distanceMatches
        }.sortedBy { com.karvin.app.domain.model.DistanceCalculator.distanceInKm(userPoint, it.point) }
        AppResult.Success(result)
    }

    override fun observeWorker(workerId: String): Flow<AppResult<User>> = store.workers.map { workers ->
        workers.firstOrNull { it.id == workerId }?.let { AppResult.Success(it) }
            ?: AppResult.Error("پروفایل متخصص پیدا نشد")
    }

    override fun observeReviews(workerId: String): Flow<AppResult<List<Review>>> =
        kotlinx.coroutines.flow.flowOf(AppResult.Success(FakeData.reviews[workerId].orEmpty()))

    override suspend fun toggleAvailability(isAvailable: Boolean): AppResult<User> {
        val worker = store.workers.value.first().copy(isAvailable = isAvailable)
        store.workers.value = store.workers.value.map { if (it.id == worker.id) worker else it }
        return AppResult.Success(worker)
    }

    override suspend fun toggleFavorite(workerId: String): AppResult<Boolean> {
        val enabled = workerId !in store.favoriteWorkers.value
        store.favoriteWorkers.value = if (enabled) store.favoriteWorkers.value + workerId else store.favoriteWorkers.value - workerId
        store.setFavorite("worker", workerId, enabled)
        return AppResult.Success(enabled)
    }

    override suspend fun inviteWorker(workerId: String, jobId: String): AppResult<Unit> = AppResult.Success(Unit)

    override suspend fun rateWorker(input: RatingInput): AppResult<Review> {
        val review = Review(newId("review"), "شما", input.rating, input.comment, java.time.LocalDate.now())
        return AppResult.Success(review)
    }
}

class FakeChatRepository(private val store: FakeRepositoryStore) : ChatRepository {
    override fun observeConversations(): Flow<AppResult<List<Conversation>>> =
        store.messages.map { allMessages -> AppResult.Success(FakeData.conversations(FakeData.workers.first().id).map { conversation ->
            val last = allMessages.filter { message -> message.conversationId == conversation.id }.maxByOrNull { message -> message.sentAt }
            conversation.copy(lastMessage = last)
        }) }

    override fun observeMessages(conversationId: String): Flow<AppResult<List<ChatMessage>>> = store.messages.map { messages ->
        AppResult.Success(messages.filter { it.conversationId == conversationId }.sortedBy { it.sentAt })
    }

    override suspend fun sendMessage(conversationId: String, text: String): AppResult<ChatMessage> {
        val message = ChatMessage(newId("message"), conversationId, FakeData.workers.first().id, text, LocalDateTime.now(), false)
        store.messages.value = store.messages.value + message
        store.cacheMessages(store.messages.value)
        return AppResult.Success(message)
    }
}

class FakeNotificationRepository(private val store: FakeRepositoryStore) : NotificationRepository {
    override fun observeNotifications(): Flow<AppResult<List<AppNotification>>> = store.notifications.map { AppResult.Success(it) }

    override suspend fun markAsRead(notificationId: String): AppResult<Unit> {
        store.notifications.value = store.notifications.value.map { if (it.id == notificationId) it.copy(isRead = true) else it }
        return AppResult.Success(Unit)
    }

    override suspend fun markAllAsRead(): AppResult<Unit> {
        store.notifications.value = store.notifications.value.map { it.copy(isRead = true) }
        return AppResult.Success(Unit)
    }
}
