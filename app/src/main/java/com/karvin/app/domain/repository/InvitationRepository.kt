package com.karvin.app.domain.repository

import com.karvin.app.domain.model.InvitationStatus
import com.karvin.app.domain.model.JobInvitation
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface InvitationRepository {
    fun getWorkerInvitations(workerId: String): Flow<List<JobInvitation>>
    fun getEmployerSentInvitations(employerId: String): Flow<List<JobInvitation>>
    suspend fun sendInvitation(invitation: JobInvitation): Resource<JobInvitation>
    suspend fun respondToInvitation(invitationId: String, status: InvitationStatus): Resource<Boolean>
}
