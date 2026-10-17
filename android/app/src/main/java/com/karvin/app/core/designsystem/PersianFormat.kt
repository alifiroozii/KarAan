package com.karvin.app.core.designsystem

import com.karvin.app.domain.model.toPersianDigits
import java.util.Locale

/**
 * Persian presentation helpers layered on top of the canonical digit conversion
 * in `domain.model.toPersianDigits`.
 *
 * The digit conversion itself lives in the domain layer because business logic
 * (distance formatting, date formatting) needs it too. This file adds only
 * money/duration formatting that belongs to the design system, so the two never
 * declare the same extension twice.
 */

/**
 * Groups an amount with thousands separators, then localises the separators.
 *
 * Money is stored as integer Rials (`Long`). This only formats — it never does
 * arithmetic, so no floating point can reach a persisted value.
 */
fun Long.toPersianAmount(): String = String.format(Locale.US, "%,d", this).toPersianDigits()

/**
 * Compact money for dense surfaces such as cards and list rows.
 *
 * Below one million Rials the exact grouped number is shown, because rounding a
 * small wage to "۰٫۵ م" hides information the user needs to compare offers.
 */
fun Long.toCompactPersianAmount(): String = when {
    this >= 1_000_000_000 -> "${(this / 1_000_000_000.0).toPersianDigits()} میلیارد"
    this >= 1_000_000 -> "${(this / 1_000_000.0).toPersianDigits()} میلیون"
    else -> toPersianAmount()
}

/** Human-readable amount with the currency suffix, e.g. «۱٫۲۰۰٫۰۰۰ ریال». */
fun Long.toPersianRials(): String = "${toPersianAmount()} ریال"

/** Duration in hours, localised. */
fun Double.toPersianHours(): String = "${toPersianDigits()} ساعت"

/** Distance in kilometres, localised. */
fun Double.toPersianKilometers(): String = "${toPersianDigits()} کیلومتر"

