package com.karvin.app.feature.jobs

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.karvin.app.core.designsystem.star
import androidx.compose.ui.unit.dp

@Composable
fun RatingDialog(onDismiss: () -> Unit, onSubmit: (Int, String) -> Unit) {
    var rating by remember { mutableIntStateOf(0) }
    var comment by remember { mutableStateOf("") }
    AlertDialog(onDismissRequest = onDismiss, title = { Text("ثبت امتیاز") }, text = { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) { (1..5).forEach { value -> IconButton(onClick = { rating = value }) { Icon(Icons.Default.Star, "امتیاز $value", tint = if (value <= rating) MaterialTheme.colorScheme.star else MaterialTheme.colorScheme.outline) } } }
        OutlinedTextField(comment, { comment = it }, modifier = Modifier.fillMaxWidth(), label = { Text("نظر شما") }, minLines = 3)
    } }, confirmButton = { Button(onClick = { if (rating > 0) onSubmit(rating, comment) }, enabled = rating > 0) { Text("ثبت") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("انصراف") } })
}
