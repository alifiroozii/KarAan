package com.karvin.app.domain.model

enum class TransactionType {
    SHIFT_PAYOUT,      // واریز دستمزد شیفت
    WALLET_WITHDRAWAL, // درخواست تسویه حساب و واریز به شبا
    JOB_PAYMENT,       // پرداخت هزینه دستمزد کارگران توسط کارفرما
    PLATFORM_FEE,      // کارمزد پلتفرم کاروین
    WALLET_DEPOSIT     // افزایش موجودی کیف پول
}

enum class TransactionStatus {
    SUCCESS,
    PENDING,
    FAILED
}

data class Transaction(
    val id: String,
    val userId: String,
    val title: String,
    val description: String,
    val amountToman: Long,
    val type: TransactionType,
    val status: TransactionStatus = TransactionStatus.SUCCESS,
    val trackingCode: String,
    val timestamp: Long = System.currentTimeMillis(),
    val relatedJobTitle: String? = null
)

data class Wallet(
    val userId: String,
    val balanceToman: Long = 0,
    val totalEarnedToman: Long = 0,
    val pendingPayoutToman: Long = 0,
    val ibanNumber: String = "IR120170000000123456789012",
    val bankName: String = "بانک ملی ایران"
)
