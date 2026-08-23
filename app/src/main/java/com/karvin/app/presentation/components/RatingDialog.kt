package com.karvin.app.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.presentation.theme.Amber500

@Composable
fun RatingDialog(
    workerName: String,
    onDismiss: () -> Unit,
    onSubmit: (Float, String) -> Unit
) {
    var rating by remember { mutableFloatStateOf(5.0f) }
    var comment by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "امتیازدهی به $workerName",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "کیفیت کار، خوش‌قولی و تخصص نیرو را ارزیابی کنید:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                // 5 Star rating row
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (i in 1..5) {
                        val isFilled = i <= rating
                        Icon(
                            imageVector = if (isFilled) Icons.Default.Star else Icons.Outlined.StarBorder,
                            contentDescription = "Star $i",
                            tint = Amber500,
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .clickable { rating = i.toFloat() }
                                .padding(2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                KarvinTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = "نظر یا توضیحات تکمیلی (اختیاری)",
                    placeholder = "تجربه همکاری خود را بنویسید...",
                    singleLine = false,
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            KarvinButton(
                text = "ثبت امتیاز",
                onClick = { onSubmit(rating, comment) },
                type = KarvinButtonType.PRIMARY,
                modifier = Modifier.fillMaxWidth(0.48f),
                height = 42.dp,
                shapeRadius = 10.dp
            )
        },
        dismissButton = {
            KarvinButton(
                text = "انصراف",
                onClick = onDismiss,
                type = KarvinButtonType.OUTLINED,
                modifier = Modifier.fillMaxWidth(0.48f),
                height = 42.dp,
                shapeRadius = 10.dp
            )
        },
        shape = RoundedCornerShape(20.dp)
    )
}
