package com.karvin.app.domain.model

data class Wallet(val id: String, val balance: Long, val currency: String = "IRR")

enum class TransactionType { DEPOSIT, WITHDRAWAL, PAYMENT, REFUND, EARNING }
enum class TransactionStatus { PENDING, SUCCESS, FAILED }
data class WalletTransaction(val id: String, val amount: Long, val type: TransactionType, val status: TransactionStatus, val description: String, val createdAt: String)
data class PaymentRequest(val amount: Long, val jobId: String? = null)
data class PaymentStart(val paymentId: String, val redirectUrl: String)
data class RatingRequest(val jobId: String, val targetId: String, val rating: Int, val comment: String)
