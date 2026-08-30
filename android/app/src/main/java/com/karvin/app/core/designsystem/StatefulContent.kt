package com.karvin.app.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.karvin.app.core.designsystem.KarvinDimensions
import com.karvin.app.core.common.UiState

@Composable
fun <T> StatefulContent(
    state: UiState<T>,
    modifier: Modifier = Modifier,
    emptyMessage: String = "موردی پیدا نشد",
    onRetry: (() -> Unit)? = null,
    content: @Composable (T) -> Unit,
) {
    when (state) {
        UiState.Loading -> Column(modifier.fillMaxWidth().padding(KarvinDimensions.spacing32), horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator() }
        is UiState.Error -> Column(modifier.fillMaxWidth().padding(KarvinDimensions.spacing24), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(state.message, color = MaterialTheme.colorScheme.error)
            if (state.canRetry && onRetry != null) Button(onClick = onRetry) { Text("تلاش مجدد") }
        }
        is UiState.Success -> if (state.data is Collection<*> && state.data.isEmpty()) {
            Column(modifier.fillMaxWidth().padding(KarvinDimensions.spacing24), horizontalAlignment = Alignment.CenterHorizontally) { Text(emptyMessage) }
        } else content(state.data)
    }
}
