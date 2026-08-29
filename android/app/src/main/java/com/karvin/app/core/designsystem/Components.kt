package com.karvin.app.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.model.toRialString
import com.karvin.app.domain.usecase.label
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun KarvinLogo(modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.secondary),
            contentAlignment = Alignment.Center,
        ) {
            Text("ک", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSecondary)
        }
        Spacer(Modifier.width(10.dp))
        Text("کاروین", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
fun AppTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack, modifier = Modifier.semantics { contentDescription = "بازگشت" }) {
                Text("‹", style = MaterialTheme.typography.headlineSmall)
            }
            Spacer(Modifier.width(4.dp))
        }
        Text(title, style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
        actions()
    }
}

@Composable
fun Avatar(
    user: User,
    modifier: Modifier = Modifier,
    size: androidx.compose.ui.unit.Dp = 48.dp,
) {
    val initials = user.name.take(1)
    if (user.avatarUrl.isNullOrBlank()) {
        Box(
            modifier = modifier
                .size(size)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            Text(initials, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onPrimaryContainer)
        }
    } else {
        AsyncImage(user.avatarUrl, contentDescription = "تصویر ${user.name}", modifier = modifier.size(size).clip(CircleShape), contentScale = ContentScale.Crop)
    }
}

@Composable
fun RatingLine(rating: Double, reviewCount: Int? = null) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.Star, contentDescription = "امتیاز", tint = Color(0xFFE2A63B), modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(4.dp))
        Text(String.format(Locale.US, "%.1f", rating).toPersianDigits(), style = MaterialTheme.typography.labelLarge)
        if (reviewCount != null) {
            Spacer(Modifier.width(4.dp))
            Text("(${reviewCount.toString().toPersianDigits()} نظر)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun JobCard(job: Job, userPoint: GeoPoint, onClick: () -> Unit, onSave: () -> Unit, showSave: Boolean = true) {
    val distance = DistanceCalculator.distanceInKm(userPoint, job.point)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .semantics { contentDescription = "درخواست ${job.title}" },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(job.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (job.isUrgent) {
                            Spacer(Modifier.width(8.dp))
                            Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                                Text("فوری", modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                            }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(job.category.title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                }
                if (showSave) {
                    IconButton(onClick = onSave, modifier = Modifier.semantics { contentDescription = if (job.isSaved) "حذف از ذخیره‌ها" else "ذخیره درخواست" }) {
                        Text(if (job.isSaved) "★" else "☆", style = MaterialTheme.typography.headlineSmall, color = if (job.isSaved) Color(0xFFE2A63B) else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Text(job.description, maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(job.amount.toRialString(), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                Text("${job.startTime.toPersianTime()} · ${DistanceCalculator.format(distance)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(job.employer, size = 26.dp)
                Spacer(Modifier.width(8.dp))
                Text(job.employer.name, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                RatingLine(job.employer.rating)
            }
        }
    }
}

@Composable
fun OnlinePill(isOnline: Boolean, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = if (isOnline) Color(0xFF17A673).copy(alpha = .16f) else MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(8.dp),
    ) {
        Text(
            if (isOnline) "آنلاین" else "آفلاین",
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (isOnline) Color(0xFF128A5E) else MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun WorkerCard(worker: User, userPoint: GeoPoint, onClick: () -> Unit, onFavorite: () -> Unit) {
    val distance = DistanceCalculator.distanceInKm(userPoint, worker.point)
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(worker, size = 56.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(worker.name, style = MaterialTheme.typography.titleMedium)
                    if (worker.isVerified) {
                        Spacer(Modifier.width(5.dp))
                        Icon(Icons.Default.CheckCircle, contentDescription = "احراز هویت شده", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(17.dp))
                    }
                }
                Text(worker.skills.firstOrNull() ?: "متخصص خدمات", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(5.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    RatingLine(worker.rating)
                    Text(DistanceCalculator.format(distance), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                OnlinePill(worker.isAvailable)
                IconButton(onClick = onFavorite, modifier = Modifier.size(34.dp).semantics { contentDescription = "افزودن به علاقه‌مندی‌ها" }) {
                    Text("♡", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }
    }
}

@Composable
fun CategoryChip(categoryTitle: String, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text(categoryTitle) },
        leadingIcon = if (selected) ({ Text("✓") }) else null,
        modifier = Modifier.height(40.dp),
    )
}

@Composable
fun PrimaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    Button(
        onClick = onClick,
        modifier = modifier.height(52.dp),
        enabled = enabled,
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(horizontal = 22.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp, pressedElevation = 2.dp),
    ) {
        Text(text)
    }
}

@Composable
fun EmptyState(title: String, message: String, action: (() -> Unit)? = null, actionText: String = "بازگشت") {
    Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("⌁", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
        Text(title, style = MaterialTheme.typography.titleLarge)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (action != null) OutlinedButton(onClick = action) { Text(actionText) }
    }
}

@Composable
fun LoadingState() {
    Box(Modifier.fillMaxWidth().padding(42.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit) {
    EmptyState("مشکلی پیش آمد", message, onRetry, "تلاش دوباره")
}

fun LocalDate.toPersianDate(): String = "$dayOfMonth ${monthValue.toString().toPersianDigits()} / ${year.toString().toPersianDigits()}"
fun LocalTime.toPersianTime(): String = String.format(Locale.US, "%02d:%02d", hour, minute).toPersianDigits()
