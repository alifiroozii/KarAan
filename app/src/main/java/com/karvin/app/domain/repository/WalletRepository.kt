package com.karvin.app.domain.repository

import com.karvin.app.domain.model.Transaction
import com.karvin.app.domain.model.Wallet
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface WalletRepository {
    fun getWallet(userId: String): Flow<Wallet>
    fun getTransactions(userId: String): Flow<List<Transaction>>
    suspend fun requestWithdrawal(userId: String, amountToman: Long): Resource<Transaction>
    suspend fun depositToWallet(userId: String, amountToman: Long): Resource<Transaction>
}

interface PaymentRepository {
    suspend fun payForJob(employerId: String, jobId: String, totalAmountToman: Long, workerCount: Int): Resource<Transaction>
    fun getEmployerInvoices(employerId: String): Flow<List<Transaction>>
    fun calculatePlatformFee(amountToman: Long): Long {
        return (amountToman * 0.05).toLong() // 5% platform commission
    }
}
