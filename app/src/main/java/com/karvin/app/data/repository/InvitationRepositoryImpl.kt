package com.karvin.app.data.repository

import com.karvin.app.domain.model.InvitationStatus
import com.karvin.app.domain.model.JobInvitation
import com.karvin.app.domain.repository.InvitationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InvitationRepositoryImpl @Inject constructor() : InvitationRepository {

    private val invitationsFlow = MutableStateFlow(
        listOf(
            JobInvitation(
                id = "inv_1",
                employerId = "emp_101",
                employerName = "مهندس علیرضا رضایی",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                employerRating = 4.9f,
                workerId = "worker_default",
                workerName = "محمد حسینی",
                jobId = "job_1",
                jobTitle = "برق‌کار صنعتی و تابلو برق پروژه سعادت‌آباد",
                jobSalaryToman = 1350000L,
                jobDate = "۱۴۰۳/۰۶/۰۵",
                jobTime = "۰۸:۳۰ الی ۱۷:۰۰",
                location = "تهران، سعادت‌آباد، میدان کاج",
                status = InvitationStatus.PENDING,
                message = "سلام آقا محمد، رزومه و سوابق شما بررسی شد. خوشحال می‌شویم در این پروژه با ما همکاری کنید."
            )
        )
    )

    override fun getWorkerInvitations(workerId: String): Flow<List<JobInvitation>> {
        return invitationsFlow.map { list -> list.filter { it.workerId == workerId } }
    }

    override fun getEmployerSentInvitations(employerId: String): Flow<List<JobInvitation>> {
        return invitationsFlow.map { list -> list.filter { it.employerId == employerId } }
    }

    override suspend fun sendInvitation(invitation: JobInvitation): Resource<JobInvitation> {
        val current = invitationsFlow.value.toMutableList()
        current.add(0, invitation)
        invitationsFlow.value = current
        return Resource.Success(invitation)
    }

    override suspend fun respondToInvitation(invitationId: String, status: InvitationStatus): Resource<Boolean> {
        val current = invitationsFlow.value.toMutableList()
        val index = current.indexOfFirst { it.id == invitationId }
        if (index != -1) {
            current[index] = current[index].copy(status = status)
            invitationsFlow.value = current
        }
        return Resource.Success(true)
    }
}
