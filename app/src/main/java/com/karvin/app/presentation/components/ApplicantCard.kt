package com.karvin.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.presentation.theme.Amber100
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red100
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ApplicantCard(
    application: JobApplication,
    onAcceptClick: () -> Unit,
    onRejectClick: () -> Unit,
    onRateClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val (statusBg, statusTextColor, statusText) = when (application.status) {
        ApplicationStatus.PENDING -> Triple(Amber100, Amber500, "در انتظار بررسی")
        ApplicationStatus.ACCEPTED -> Triple(Emerald100, Emerald600, "تایید شده")
        ApplicationStatus.REJECTED -> Triple(Red100, Red500, "رد شده")
        ApplicationStatus.CANCELLED -> Triple(Color.LightGray.copy(alpha = 0.3f), Color.DarkGray, "لغو شده")
        ApplicationStatus.COMPLETED -> Triple(Emerald100, Emerald600, "تکمیل شده")
    }

    KarvinCard(
        modifier = modifier.fillMaxWidth(),
        shapeRadius = 16.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Worker Avatar, Name, Rating & Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Navy900.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Navy900,
                            modifier = Modifier.size(26.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Text(
                            text = application.workerName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = Amber500,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = PersianDateFormatter.toPersianDigits(application.workerRating),
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "(${PersianDateFormatter.toPersianDigits(application.workerExperienceYears)} سال سابقه)",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondaryLight
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(statusBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusTextColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Job Title
            Text(
                text = "مربوط به: ${application.jobTitle}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Skills chips
            if (application.workerSkills.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    application.workerSkills.forEach { skill ->
                        KarvinSkillBadge(text = skill, isHighlighted = true)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Actions Row
            if (application.status == ApplicationStatus.PENDING) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KarvinButton(
                        text = "رد درخواست",
                        onClick = onRejectClick,
                        type = KarvinButtonType.OUTLINED,
                        icon = Icons.Default.Close,
                        modifier = Modifier.weight(1f),
                        height = 40.dp,
                        shapeRadius = 10.dp
                    )
                    KarvinButton(
                        text = "تایید نیرو",
                        onClick = onAcceptClick,
                        type = KarvinButtonType.SECONDARY,
                        icon = Icons.Default.Check,
                        modifier = Modifier.weight(1f),
                        height = 40.dp,
                        shapeRadius = 10.dp
                    )
                }
            } else if (application.status == ApplicationStatus.ACCEPTED && onRateClick != null) {
                KarvinButton(
                    text = "ثبت امتیاز و نظر برای نیرو",
                    onClick = onRateClick,
                    type = KarvinButtonType.OUTLINED,
                    icon = Icons.Default.Star,
                    modifier = Modifier.fillMaxWidth(),
                    height = 40.dp,
                    shapeRadius = 10.dp
                )
            }
        }
    }
}
