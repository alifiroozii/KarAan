package com.karvin.app.utils

import java.text.DecimalFormat
import java.text.NumberFormat
import java.util.Locale

object PersianDateFormatter {

    private val persianDigits = arrayOf("۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹")

    fun toPersianDigits(input: String): String {
        var result = input
        for (i in 0..9) {
            result = result.replace(i.toString(), persianDigits[i])
        }
        return result
    }

    fun toPersianDigits(number: Number): String {
        return toPersianDigits(number.toString())
    }

    fun formatRelativeTime(timestamp: Long): String {
        val diff = System.currentTimeMillis() - timestamp
        val minutes = diff / (1000 * 60)
        val hours = minutes / 60
        val days = hours / 24

        return when {
            minutes < 5 -> "لحظاتی پیش"
            minutes < 60 -> "${toPersianDigits(minutes)} دقیقه پیش"
            hours < 24 -> "${toPersianDigits(hours)} ساعت پیش"
            days < 7 -> "${toPersianDigits(days)} روز پیش"
            else -> "${toPersianDigits(days / 7)} هفته پیش"
        }
    }
}

object PriceFormatter {

    fun formatToman(amount: Long): String {
        val formatter = NumberFormat.getNumberInstance(Locale.US) as DecimalFormat
        val formatted = formatter.format(amount)
        return "${PersianDateFormatter.toPersianDigits(formatted)} تومان"
    }

    fun formatHourlyToman(amount: Long): String {
        return "${formatToman(amount)} / ساعت"
    }

    fun formatDailyToman(amount: Long): String {
        return "${formatToman(amount)} / روزانه"
    }
}
