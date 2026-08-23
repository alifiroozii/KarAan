package com.karvin.app.presentation.rating

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.R
import com.karvin.app.domain.model.WorkerRatingSubmission
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailedRatingDialog(
    workerName: String,
    shiftId: String,
    workerId: String,
    onDismiss: () -> Unit,
    onSubmit: (WorkerRatingSubmission) -> Unit
) {
    var qualityScore by remember { mutableFloatStateOf(5.0f) }
    var attendanceScore by remember { mutableFloatStateOf(5.0f) }
    var skillScore by remember { mutableFloatStateOf(5.0f) }
    var behaviorScore by remember { mutableFloatStateOf(5.0f) }
    var comment by remember { mutableStateOf("") }

    BasicAlertDialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "ارزیابی و امتیازدهی به عملکرد نیرو",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = workerName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Navy900,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Multi-criteria rating rows
                RatingCriteriaRow(
                    title = "کیفیت و تمیزی کار",
                    score = qualityScore,
                    onScoreChange = { qualityScore = it }
                )

                Spacer(modifier = Modifier.height(10.dp))

                RatingCriteriaRow(
                    title = "حضور به موقع و انضباط",
                    score = attendanceScore,
                    onScoreChange = { attendanceScore = it }
                )

                Spacer(modifier = Modifier.height(10.dp))

                RatingCriteriaRow(
                    title = "مهارت و تسلط فنی",
                    score = skillScore,
                    onScoreChange = { skillScore = it }
                )

                Spacer(modifier = Modifier.height(10.dp))

                RatingCriteriaRow(
                    title = "اخلاق حرفه‌ای و تعهد",
                    score = behaviorScore,
                    onScoreChange = { behaviorScore = it }
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text(text = "نظر و بازخورد تکمیلی (اختیاری)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KarvinButton(
                        text = stringResource(id = R.string.cancel),
                        onClick = onDismiss,
                        type = KarvinButtonType.OUTLINED,
                        modifier = Modifier.weight(1f),
                        height = 42.dp,
                        shapeRadius = 10.dp
                    )
                    KarvinButton(
                        text = "ثبت نهایی امتیاز",
                        onClick = {
                            val submission = WorkerRatingSubmission(
                                id = "rate_${System.currentTimeMillis()}",
                                shiftId = shiftId,
                                workerId = workerId,
                                employerId = "emp_101",
                                qualityScore = qualityScore,
                                attendanceScore = attendanceScore,
                                skillScore = skillScore,
                                behaviorScore = behaviorScore,
                                comment = comment
                            )
                            onSubmit(submission)
                        },
                        type = KarvinButtonType.PRIMARY,
                        modifier = Modifier.weight(1.3f),
                        height = 42.dp,
                        shapeRadius = 10.dp
                    )
                }
            }
        }
    }
}

@Composable
private fun RatingCriteriaRow(
    title: String,
    score: Float,
    onScoreChange: (Float) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Medium
        )

        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            (1..5).forEach { star ->
                Icon(
                    imageVector = if (star <= score) Icons.Default.Star else Icons.Outlined.Star,
                    contentDescription = null,
                    tint = if (star <= score) Amber500 else Color.LightGray,
                    modifier = Modifier
                        .size(24.dp)
                        .clickable { onScoreChange(star.toFloat()) }
                )
            }
        }
    }
}
