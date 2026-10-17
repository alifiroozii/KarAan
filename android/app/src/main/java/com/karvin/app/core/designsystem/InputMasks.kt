package com.karvin.app.core.designsystem

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import com.karvin.app.domain.model.toPersianDigits

/**
 * Currency visual transformation with live 3-digit comma grouping and Persian digits.
 */
class CurrencyVisualTransformation(private val suffix: String = " تومان") : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val raw = text.text.filter(Char::isDigit)
        if (raw.isEmpty()) return TransformedText(text, OffsetMapping.Identity)

        val formattedWithCommas = raw.reversed().chunked(3).joinToString(",").reversed()
        val out = formattedWithCommas.toPersianDigits() + suffix

        val offsetMapping = object : OffsetMapping {
            override fun originalToTransformed(offset: Int): Int {
                val clamped = offset.coerceIn(0, raw.length)
                val commaCount = if (clamped == 0) 0 else (clamped - 1) / 3
                return (clamped + commaCount).coerceAtMost(out.length)
            }

            override fun transformedToOriginal(offset: Int): Int {
                val textOnly = offset.coerceAtMost(formattedWithCommas.length)
                val commasBefore = formattedWithCommas.take(textOnly).count { it == ',' }
                return (textOnly - commasBefore).coerceIn(0, raw.length)
            }
        }

        return TransformedText(AnnotatedString(out), offsetMapping)
    }
}

/**
 * Visual transformation for 16-digit Iranian bank debit cards.
 * Formats: 6037 - 9918 - 1234 - 5678
 */
class BankCardVisualTransformation : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val digits = text.text.filter(Char::isDigit).take(16)
        val formatted = digits.chunked(4).joinToString(" - ")

        val offsetMapping = object : OffsetMapping {
            override fun originalToTransformed(offset: Int): Int {
                val clamped = offset.coerceIn(0, digits.length)
                val spaces = if (clamped <= 4) 0 else if (clamped <= 8) 3 else if (clamped <= 12) 6 else 9
                return (clamped + spaces).coerceAtMost(formatted.length)
            }

            override fun transformedToOriginal(offset: Int): Int {
                val digitsCount = formatted.take(offset).count(Char::isDigit)
                return digitsCount.coerceIn(0, digits.length)
            }
        }

        return TransformedText(AnnotatedString(formatted.toPersianDigits()), offsetMapping)
    }
}

/**
 * Converts a numeric amount to Persian words.
 * e.g. 1250000 -> "یک میلیون و دویست و پنجاه هزار تومان"
 */
fun numberToPersianWords(amount: Long, unit: String = "تومان"): String {
    if (amount == 0L) return "صفر $unit"
    if (amount < 0L) return "منفی ${numberToPersianWords(-amount, unit)}"

    val yekan = listOf("", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه")
    val dahgan = listOf("", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود")
    val dahTaNoozdah = listOf("ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده")
    val sadgan = listOf("", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد")
    val scale = listOf("", "هزار", "میلیون", "میلیارد", "تریلیون")

    fun threeDigitToWords(num: Int): String {
        val s = num / 100
        val d = (num % 100) / 10
        val y = num % 10

        val parts = mutableListOf<String>()
        if (s > 0) parts.add(sadgan[s])

        if (d == 1) {
            parts.add(dahTaNoozdah[y])
        } else {
            if (d > 0) parts.add(dahgan[d])
            if (y > 0) parts.add(yekan[y])
        }
        return parts.joinToString(" و ")
    }

    var temp = amount
    val chunks = mutableListOf<Int>()
    while (temp > 0) {
        chunks.add((temp % 1000).toInt())
        temp /= 1000
    }

    val resultParts = mutableListOf<String>()
    for (i in chunks.indices.reversed()) {
        val chunk = chunks[i]
        if (chunk > 0) {
            val words = threeDigitToWords(chunk)
            val scaleName = scale.getOrNull(i).orEmpty()
            val chunkStr = if (scaleName.isNotEmpty()) "$words $scaleName" else words
            resultParts.add(chunkStr)
        }
    }

    return resultParts.joinToString(" و ") + " $unit"
}
