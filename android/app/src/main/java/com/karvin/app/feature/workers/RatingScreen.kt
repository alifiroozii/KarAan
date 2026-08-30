package com.karvin.app.feature.workers

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.StarGold

@Composable
fun RatingScreen(
    navController: NavHostController,
    targetId: String,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var rating by remember { mutableIntStateOf(5) }
    var comment by remember { mutableStateOf("") }

    LaunchedEffect(state) {
        if (state is RatingUiState.Done) {
            navController.popBackStack()
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        AppTopBar("ثبت امتیاز و نظر", onBack = { navController.popBackStack() })
        Spacer(Modifier.height(16.dp))

        Text("تجربه همکاری شما چطور بود؟", style = MaterialTheme.typography.headlineSmall)
        Text(
            "بازخورد شما به افزایش کیفیت خدمات و انتخاب‌های بهتر در کاروین کمک می‌کند.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Row(
            Modifier.fillMaxWidth().padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            (1..5).forEach { value ->
                Icon(
                    Icons.Default.Star,
                    contentDescription = "امتیاز $value",
                    tint = if (value <= rating) StarGold else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    modifier = Modifier
                        .padding(6.dp)
                        .size(44.dp)
                        .clickable { rating = value },
                )
            }
        }

        OutlinedTextField(
            value = comment,
            onValueChange = { comment = it },
            label = { Text("نظر شما (اختیاری)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 4,
            shape = RoundedCornerShape(14.dp),
        )

        Spacer(Modifier.weight(1f))

        when (state) {
            is RatingUiState.Error -> Text(
                (state as RatingUiState.Error).message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
            is RatingUiState.Done -> Text(
                "امتیاز شما با موفقیت ثبت شد.",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.bodySmall,
            )
            else -> Unit
        }

        PrimaryButton(
            text = if (state is RatingUiState.Loading) "در حال ثبت..." else "ثبت امتیاز",
            onClick = { viewModel.submit(targetId, rating, comment) },
            modifier = Modifier.fillMaxWidth(),
            enabled = state !is RatingUiState.Loading,
        )

        Spacer(Modifier.height(16.dp))
    }
}

