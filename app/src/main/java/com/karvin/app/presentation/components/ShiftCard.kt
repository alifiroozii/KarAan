package com.karvin.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.PlayArrow
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
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.presentation.theme.Amber100
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue100
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Red100
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter
import com.karvin.app.utils.PriceFormatter

@Composable
fun ShiftCard(
    shift: Shift,
    onStatusActionClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val (statusBg, statusTextColor, statusText) = when (shift.status) {
        ShiftStatus.UPCOMING -> Triple(Blue100, Blue500, "پیش‌رو")
        ShiftStatus.IN_PROGRESS -> Triple(Amber100, Amber500, "در حال اجرا")
        ShiftStatus.COMPLETED -> Triple(Emerald100, Emerald600, "پایان یافته")
        ShiftStatus.CANCELLED -> Triple(Red100, Red500, "لغو شده")
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
            // Top Row: Date & Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "تاریخ: ${PersianDateFormatter.toPersianDigits(shift.date)}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(statusBg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusTextColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Job Title
            Text(
                text = shift.jobTitle,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Business Name
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Business,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = TextSecondaryLight
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = shift.businessName,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondaryLight
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Time & Location
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = TextSecondaryLight
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${PersianDateFormatter.toPersianDigits(shift.startTime)} الی ${PersianDateFormatter.toPersianDigits(shift.endTime)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondaryLight
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = TextSecondaryLight
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = shift.location,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondaryLight,
                    maxLines = 1
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Bottom Bar: Salary & Action Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "مبلغ تسویه:",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondaryLight
                    )
                    Text(
                        text = PriceFormatter.formatToman(shift.salaryToman),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Emerald600
                    )
                }

                if (onStatusActionClick != null && shift.status != ShiftStatus.COMPLETED && shift.status != ShiftStatus.CANCELLED) {
                    val (actionText, actionType, actionIcon) = if (shift.status == ShiftStatus.UPCOMING) {
                        Triple("ثبت ورود به شیفت", KarvinButtonType.PRIMARY, Icons.Default.PlayArrow)
                    } else {
                        Triple("ثبت پایان شیفت", KarvinButtonType.SECONDARY, Icons.Default.CheckCircle)
                    }

                    KarvinButton(
                        text = actionText,
                        onClick = onStatusActionClick,
                        type = actionType,
                        icon = actionIcon,
                        modifier = Modifier.width(160.dp),
                        height = 38.dp,
                        shapeRadius = 10.dp
                    )
                }
            }
        }
    }
}
