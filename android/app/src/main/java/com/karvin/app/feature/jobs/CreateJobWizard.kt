package com.karvin.app.feature.jobs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.karvin.app.core.designsystem.KarjoorColors
import com.karvin.app.core.designsystem.KarjoorDimensions
import com.karvin.app.domain.model.toPersianDigits

/**
 * The five steps of the KARJOOR job-request form.
 *
 * The wizard is driven by a single immutable [CreateJobFormState] held by the
 * caller, so navigating back never loses completed data and the summary step can
 * render exactly what will be published. Steps are plain data — a step never
 * reaches into another step's fields.
 */
enum class CreateJobStep(val title: String, val subtitle: String) {
    WHAT("چه کاری؟", "عنوان، دسته‌بندی، توضیحات و مهارت موردنیاز"),
    WHEN("چه زمانی؟", "تاریخ، ساعت شروع، مدت و نوع همکاری"),
    WHERE("کجا؟", "شهر، موقعیت روی نقشه و نشانی تکمیلی"),
    HOW_MUCH("چه مبلغی؟", "نوع محاسبه، مبلغ پیشنهادی و توضیحات هزینه"),
    CONFIRM("تأیید", "خلاصه درخواست و انتشار"),
    ;

    val number: Int get() = ordinal + 1
    companion object {
        val total: Int = entries.size
    }
}

/**
 * Step indicator shown at the top of every wizard page.
 *
 * The progress bar is paired with the step label and the current step number so
 * a screen reader announces position, not just a bare percentage.
 */
@Composable
fun CreateJobStepHeader(
    step: CreateJobStep,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "مرحله ${step.number.toStepText()} از ${CreateJobStep.total.toStepText()}",
                style = MaterialTheme.typography.labelMedium,
                color = KarjoorColors.TextSecondary,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = step.title,
                style = MaterialTheme.typography.titleMedium,
                color = KarjoorColors.Primary,
            )
        }
        Spacer(Modifier.height(KarjoorDimensions.spacing8))
        LinearProgressIndicator(
            progress = { step.number.toFloat() / CreateJobStep.total.toFloat() },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            color = KarjoorColors.Primary,
            trackColor = KarjoorColors.Border,
        )
        Spacer(Modifier.height(KarjoorDimensions.spacing8))
        Text(
            text = step.subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = KarjoorColors.TextSecondary,
        )
    }
}

/** Localised step number. */
private fun Int.toStepText(): String = toPersianDigits()

/** Standard body for a wizard step: header, scrollable content, fixed footer. */
@Composable
fun CreateJobStepScaffold(
    step: CreateJobStep,
    footer: @Composable () -> Unit,
    content: @Composable () -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = KarjoorDimensions.screenGutter),
    ) {
        Spacer(Modifier.height(KarjoorDimensions.spacing12))
        CreateJobStepHeader(step)
        Spacer(Modifier.height(KarjoorDimensions.spacing20))

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing16),
        ) {
            content()
        }

        Spacer(Modifier.height(KarjoorDimensions.spacing16))
        footer()
        Spacer(Modifier.height(KarjoorDimensions.spacing16))
    }
}

/** Placeholder body used until each step's fields are attached. */
@Composable
fun CreateJobStepPlaceholder(step: CreateJobStep) {
    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing8),
    ) {
        Text(
            text = step.title,
            style = MaterialTheme.typography.titleLarge,
            color = KarjoorColors.TextPrimary,
            textAlign = TextAlign.Center,
        )
        Text(
            text = step.subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = KarjoorColors.TextSecondary,
            textAlign = TextAlign.Center,
        )
    }
}
