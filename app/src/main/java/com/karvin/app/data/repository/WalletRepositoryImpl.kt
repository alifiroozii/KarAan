package com.karvin.app.data.repository

import com.karvin.app.domain.model.Transaction
import com.karvin.app.domain.model.TransactionStatus
import com.karvin.app.domain.model.TransactionType
import com.karvin.app.domain.model.Wallet
import com.karvin.app.domain.repository.PaymentRepository
import com.karvin.app.domain.repository.WalletRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WalletRepositoryImpl @Inject constructor() : WalletRepository {

    private val walletFlow = MutableStateFlow(
        Wallet(
            userId = "worker_default",
            balanceToman = 4850000L,
            totalEarnedToman = 28500000L,
            pendingPayoutToman = 1350000L
        )
    )

    private val transactionsFlow = MutableStateFlow(
        listOf(
            Transaction(
                id = "tx_1",
                userId = "worker_default",
                title = "واریز دستمزد شیفت سعادت‌آباد",
                description = "تسویه حساب شیفت برق‌کاری پروژه ساختمانی",
                amountToman = 1350000L,
                type = TransactionType.SHIFT_PAYOUT,
                status = TransactionStatus.SUCCESS,
                trackingCode = "KRV-8492019",
                timestamp = System.currentTimeMillis() - 86400000,
                relatedJobTitle = "برق‌کار صنعتی ماهر"
            ),
            Transaction(
                id = "tx_2",
                userId = "worker_default",
                title = "برداشت و تسویه با شماره شبا",
                description = "انتقال پایا به حساب بانک ملی",
                amountToman = 2500000L,
                type = TransactionType.WALLET_WITHDRAWAL,
                status = TransactionStatus.SUCCESS,
                trackingCode = "KRV-7381920",
                timestamp = System.currentTimeMillis() - 259200000
            ),
            Transaction(
                id = "tx_3",
                userId = "worker_default",
                title = "واریز دستمزد شیفت سیمین‌دشت",
                description = "تسویه حساب شیفت روشنایی سوله",
                amountToman = 1200000L,
                type = TransactionType.SHIFT_PAYOUT,
                status = TransactionStatus.SUCCESS,
                trackingCode = "KRV-6291038",
                timestamp = System.currentTimeMillis() - 518400000,
                relatedJobTitle = "نصب روشنایی سوله"
            )
        )
    )

    override fun getWallet(userId: String): Flow<Wallet> = walletFlow

    override fun getTransactions(userId: String): Flow<List<Transaction>> = transactionsFlow

    override suspend fun requestWithdrawal(userId: String, amountToman: Long): Resource<Transaction> {
        val current = walletFlow.value
        if (amountToman > current.balanceToman) {
            return Resource.Error("مبلغ درخواستی بیشتر از موجودی قابل برداشت است")
        }

        val tx = Transaction(
            id = "tx_${UUID.randomUUID().toString().take(8)}",
            userId = userId,
            title = "درخواست تسویه حساب به شماره شبا",
            description = "در حال انتقال پایا به بانک ملی",
            amountToman = amountToman,
            type = TransactionType.WALLET_WITHDRAWAL,
            status = TransactionStatus.PENDING,
            trackingCode = "KRV-${(1000000..9999999).random()}",
            timestamp = System.currentTimeMillis()
        )

        walletFlow.value = current.copy(
            balanceToman = current.balanceToman - amountToman,
            pendingPayoutToman = current.pendingPayoutToman + amountToman
        )

        val updatedList = transactionsFlow.value.toMutableList()
        updatedList.add(0, tx)
        transactionsFlow.value = updatedList

        return Resource.Success(tx)
    }

    override suspend fun depositToWallet(userId: String, amountToman: Long): Resource<Transaction> {
        val current = walletFlow.value
        val tx = Transaction(
            id = "tx_${UUID.randomUUID().toString().take(8)}",
            userId = userId,
            title = "افزایش موجودی کیف پول",
            description = "پرداخت آنلاین شاپرک",
            amountToman = amountToman,
            type = TransactionType.WALLET_DEPOSIT,
            status = TransactionStatus.SUCCESS,
            trackingCode = "KRV-${(1000000..9999999).random()}",
            timestamp = System.currentTimeMillis()
        )

        walletFlow.value = current.copy(balanceToman = current.balanceToman + amountToman)
        val updatedList = transactionsFlow.value.toMutableList()
        updatedList.add(0, tx)
        transactionsFlow.value = updatedList

        return Resource.Success(tx)
    }
}

@Singleton
class PaymentRepositoryImpl @Inject constructor() : PaymentRepository {

    private val employerInvoicesFlow = MutableStateFlow(
        listOf(
            Transaction(
                id = "inv_1",
                userId = "emp_101",
                title = "پرداخت دستمزد ۳ کارگر پروژه سعادت‌آباد",
                description = "تسویه حساب شیفت روز گذشته به علاوه ۵٪ کارمزد پلتفرم",
                amountToman = 4252500L,
                type = TransactionType.JOB_PAYMENT,
                status = TransactionStatus.SUCCESS,
                trackingCode = "PAY-9102834",
                timestamp = System.currentTimeMillis() - 86400000,
                relatedJobTitle = "برق‌کار صنعتی و ساختمانی"
            )
        )
    )

    override suspend fun payForJob(
        employerId: String,
        jobId: String,
        totalAmountToman: Long,
        workerCount: Int
    ): Resource<Transaction> {
        val fee = (totalAmountToman * 0.05).toLong()
        val totalWithFee = totalAmountToman + fee

        val tx = Transaction(
            id = "inv_${UUID.randomUUID().toString().take(8)}",
            userId = employerId,
            title = "پرداخت دستمزد $workerCount نیرو",
            description = "تسویه حساب آنلاین دستمزد روزانه به همراه بیمه و کارمزد",
            amountToman = totalWithFee,
            type = TransactionType.JOB_PAYMENT,
            status = TransactionStatus.SUCCESS,
            trackingCode = "PAY-${(1000000..9999999).random()}",
            timestamp = System.currentTimeMillis()
        )

        val updated = employerInvoicesFlow.value.toMutableList()
        updated.add(0, tx)
        employerInvoicesFlow.value = updated

        return Resource.Success(tx)
    }

    override fun getEmployerInvoices(employerId: String): Flow<List<Transaction>> = employerInvoicesFlow
}
