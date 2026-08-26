package com.karvin.app.feature.workers

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.ErrorState
import com.karvin.app.core.designsystem.LoadingState
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.Review
import com.karvin.app.domain.model.toPersianDigits

@Composable
fun WorkerProfileScreen(navController: NavHostController, workerId: String, viewModel: WorkerProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(workerId) { viewModel.load(workerId) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("پروفایل نیرو", onBack = { navController.popBackStack() })
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error.orEmpty()) { viewModel.load(workerId) }
            state.worker == null -> EmptyState("پروفایل پیدا نشد", "این نیرو دیگر در دسترس نیست.")
            else -> {
                val worker = state.worker!!
                LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer), shape = RoundedCornerShape(20.dp)) {
                            Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Avatar(worker, size = 86.dp)
                                Row(verticalAlignment = Alignment.CenterVertically) { Text(worker.name, style = MaterialTheme.typography.headlineSmall); if (worker.isVerified) { Icon(Icons.Default.CheckCircle, "احراز هویت شده", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(start = 5.dp)) } }
                                Text("${worker.city} · ${worker.skills.firstOrNull() ?: "متخصص خدمات"}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                RatingLine(worker.rating, worker.reviewCount)
                                Text(if (worker.isAvailable) "● آماده به کار" else "○ در حال حاضر غیرفعال", color = if (worker.isAvailable) Color(0xFF2C8B57) else MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                    item { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Stat("امتیاز", String.format(java.util.Locale.US, "%.1f", worker.rating), Modifier.weight(1f)); Stat("کار انجام‌شده", worker.completedJobs.toString().toPersianDigits(), Modifier.weight(1f)); Stat("نظرها", worker.reviewCount.toString().toPersianDigits(), Modifier.weight(1f)) } }
                    item { Text("درباره من", style = MaterialTheme.typography.titleLarge); Text(worker.bio, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    item { Text("مهارت‌ها", style = MaterialTheme.typography.titleLarge); Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { worker.skills.forEach { skill -> androidx.compose.material3.AssistChip(onClick = {}, label = { Text(skill) }) } } }
                    item { Text("نظر کارفرماها", style = MaterialTheme.typography.titleLarge) }
                    if (state.reviews.isEmpty()) item { EmptyState("هنوز نظری ثبت نشده", "پس از اولین همکاری نظرها اینجا دیده می‌شوند.") } else items(state.reviews, key = { it.id }) { review -> ReviewCard(review) }
                    item { Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { OutlinedButton(onClick = { navController.navigate(Routes.conversation("conversation-1")) }, modifier = Modifier.weight(1f)) { Text("پیام دادن") }; Button(onClick = { navController.navigate(Routes.createJob(worker.id)) }, modifier = Modifier.weight(1f)) { Text("ارسال پیشنهاد") } } }
                    item { Spacer(Modifier.height(25.dp)) }
                }
            }
        }
    }
}

@Composable
private fun Stat(label: String, value: String, modifier: Modifier) { Card(modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) { Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary); Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }

@Composable
private fun ReviewCard(review: Review) { Card(shape = RoundedCornerShape(14.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(review.authorName, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f)); Row { repeat(review.rating) { Icon(Icons.Default.Star, "امتیاز", tint = Color(0xFFE2A63B), modifier = Modifier.padding(1.dp)) } } }; Text(review.comment, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
