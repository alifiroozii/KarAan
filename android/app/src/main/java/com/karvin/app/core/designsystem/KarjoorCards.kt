package com.karvin.app.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.toPersianDigits

/**
 * KARJOOR domain cards.
 *
 * An opportunity card must answer five questions and nothing more: what, how
 * much, when, how long, how far. Every extra field is noise on a 360dp screen, so
 * category, status and the detail action sit outside that core row.
 */

/** Colour for a job status. The status owns the colour; the card never chooses. */
@Composable
private fun statusColor(status: JobStatus) = when (status) {
    JobStatus.OPEN -> KarjoorColors.Primary
    JobStatus.APPLIED -> KarjoorColors.Warning
    JobStatus.ACCEPTED -> KarjoorColors.Secondary
    JobStatus.WORKER_ON_THE_WAY -> KarjoorColors.Secondary
    JobStatus.ARRIVED -> KarjoorColors.Secondary
    JobStatus.IN_PROGRESS -> KarjoorColors.Secondary
    JobStatus.COMPLETED -> KarjoorColors.Success
    JobStatus.RATED -> KarjoorColors.Success
    JobStatus.CANCELLED -> KarjoorColors.Error
}

/** Persian label for a job status. */
fun JobStatus.persianLabel(): String = when (this) {
    JobStatus.OPEN -> "باز"
    JobStatus.APPLIED -> "در انتظار پاسخ"
    JobStatus.ACCEPTED -> "پذیرفته شد"
    JobStatus.WORKER_ON_THE_WAY -> "در مسیر"
    JobStatus.ARRIVED -> "رسیده"
    JobStatus.IN_PROGRESS -> "در حال انجام"
    JobStatus.COMPLETED -> "پایان‌یافته"
    JobStatus.RATED -> "امتیازدهی شد"
    JobStatus.CANCELLED -> "لغو شده"
}

/**
 * Opportunity card — the primary unit of the Performer feed.
 *
 * @param distanceLabel pre-formatted, already-localised distance string.
 */
@Composable
fun KarjoorOpportunityCard(
    job: Job,
    distanceLabel: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    KarjoorCard(
        modifier = modifier.fillMaxWidth(),
        onClick = onClick,
        contentDescription = "کار ${job.title}، ${job.amount.toPersianAmount()} ریال، فاصله $distanceLabel",
    ) {
        Column(
            Modifier.padding(KarjoorDimensions.spacing16),
            verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
        ) {
            // Title row plus urgent marker.
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = job.title,
                    style = MaterialTheme.typography.titleLarge,
                    color = KarjoorColors.TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                if (job.isUrgent) {
                    Spacer(Modifier.width(KarjoorDimensions.spacing8))
                    KarjoorStatusPill("فوری", KarjoorColors.AccentCoral)
                }
            }

            // The five essential facts: amount, date, duration, distance, type.
            Text(
                text = job.amount.toPersianRials(),
                style = MaterialTheme.typography.titleMedium,
                color = KarjoorColors.Primary,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing16)) {
                KarjoorMetaRow(job.date.toString(), icon = Icons.Default.CalendarMonth)
                KarjoorMetaRow(job.durationHours.toPersianHours(), icon = Icons.Default.AccessTime)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing16)) {
                KarjoorMetaRow(distanceLabel, icon = Icons.Default.Place)
                KarjoorMetaRow(job.category.title, icon = Icons.Default.WorkOutline)
            }
        }
    }

/** Request card — the primary unit of the Requester "my jobs" feed. */
@Composable
fun KarjoorRequestCard(
    job: Job,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    applicantCount: Int = job.applicantCount,
) {
    KarjoorCard(
        modifier = modifier.fillMaxWidth(),
        onClick = onClick,
        contentDescription = "درخواست ${job.title}، وضعیت ${job.status.persianLabel()}",
    ) {
        Column(
            Modifier.padding(KarjoorDimensions.spacing16),
            verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = job.title,
                    style = MaterialTheme.typography.titleLarge,
                    color = KarjoorColors.TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                KarjoorStatusPill(job.status.persianLabel(), statusColor(job.status))
            }

            Text(
                text = job.amount.toPersianRials(),
                style = MaterialTheme.typography.titleMedium,
                color = KarjoorColors.Primary,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing16)) {
                KarjoorMetaRow(job.date.toString(), icon = Icons.Default.CalendarMonth)
                KarjoorMetaRow(job.durationHours.toPersianHours(), icon = Icons.Default.AccessTime)
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Payments,
                    contentDescription = null,
                    tint = KarjoorColors.TextSecondary,
                    modifier = Modifier.size(14.dp),
                )
                Spacer(Modifier.width(KarjoorDimensions.spacing4))
                Text(
                    text = if (applicantCount == 0) {
                        "هنوز متقاضی نداری"
                    } else {
                        "${applicantCount.toString().toPersianDigits()} متقاضی"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = if (applicantCount == 0) {
                        KarjoorColors.TextSecondary
                    } else {
                        KarjoorColors.Secondary
                    },
                )
            }
        }
    }
}

/** Icon for urgent markers in section headers. */
val KarjoorUrgentIcon = Icons.Default.Bolt

}
