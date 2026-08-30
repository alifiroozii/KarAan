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
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material.icons.outlined.FavoriteBorder
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.onGloballyPositioned
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

// Shared brand accents used across screens (theme-safe in light and dark).
val StarGold: Color @Composable get() = MaterialTheme.colorScheme.star
val OnlineGreen: Color @Composable get() = MaterialTheme.colorScheme.online
val OnlineGreenDark: Color @Composable get() = MaterialTheme.colorScheme.online
val ProviderAmber: Color @Composable get() = MaterialTheme.colorScheme.provider

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
                Icon(Icons.Rounded.ArrowBack, contentDescription = "بازگشت")
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
        Icon(Icons.Default.Star, contentDescription = "امتیاز", tint = StarGold, modifier = Modifier.size(18.dp))
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
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
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
                        Icon(
                            if (job.isSaved) Icons.Filled.Star else Icons.Outlined.StarBorder,
                            contentDescription = null,
                            tint = if (job.isSaved) StarGold else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(24.dp),
                        )
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

fun Modifier.shimmerEffect(): Modifier = composed {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val transition = rememberInfiniteTransition(label = "shimmer")
    val startOffsetX by transition.animateFloat(
        initialValue = -2 * size.width.toFloat(),
        targetValue = 2 * size.width.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1100, easing = LinearEasing),
        ),
        label = "shimmerOffsetX",
    )

    background(
        brush = Brush.linearGradient(
            colors = listOf(
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.15f),
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            ),
            start = Offset(startOffsetX, 0f),
            end = Offset(startOffsetX + size.width.toFloat(), size.height.toFloat()),
        ),
    ).onGloballyPositioned {
        size = it.size
    }
}

@Composable
fun OnlinePill(isOnline: Boolean, modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulseAlpha",
    )

    Surface(
        modifier = modifier,
        color = if (isOnline) MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.65f) else MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(10.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            if (isOnline) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.tertiary.copy(alpha = alpha)),
                )
            }
            Text(
                if (isOnline) "آنلاین" else "آفلاین",
                style = MaterialTheme.typography.labelSmall,
                color = if (isOnline) MaterialTheme.colorScheme.onTertiaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
fun WorkerCard(worker: User, userPoint: GeoPoint, onClick: () -> Unit, onFavorite: () -> Unit) {
    val distance = DistanceCalculator.distanceInKm(userPoint, worker.point)
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(worker, size = 56.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(worker.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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
                    Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
fun CategoryChip(categoryTitle: String, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text(categoryTitle, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
        leadingIcon = if (selected) ({ Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp)) }) else null,
        modifier = Modifier.height(40.dp),
        shape = RoundedCornerShape(12.dp),
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
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp, pressedElevation = 0.dp),
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun EmptyState(title: String, message: String, action: (() -> Unit)? = null, actionText: String = "بازگشت") {
    Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp))
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (action != null) OutlinedButton(onClick = action, shape = RoundedCornerShape(12.dp)) { Text(actionText) }
    }
}

@Composable
fun LoadingState() {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        repeat(3) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .shimmerEffect(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
            ) {}
        }
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit) {
    EmptyState("مشکلی پیش آمد", message, onRetry, "تلاش دوباره")
}

data class JalaliDate(val year: Int, val month: Int, val day: Int) {
    val monthName: String
        get() = when (month) {
            1 -> "فروردین"
            2 -> "اردیبهشت"
            3 -> "خرداد"
            4 -> "تیر"
            5 -> "مرداد"
            6 -> "شهریور"
            7 -> "مهر"
            8 -> "آبان"
            9 -> "آذر"
            10 -> "دی"
            11 -> "بهمن"
            12 -> "اسفند"
            else -> ""
        }

    fun format(): String = "$day $monthName $year".toPersianDigits()
    fun formatShort(): String = "${year}/${String.format(Locale.US, "%02d", month)}/${String.format(Locale.US, "%02d", day)}".toPersianDigits()
}

fun LocalDate.toJalali(): JalaliDate {
    val gy = year
    val gm = monthValue
    val gd = dayOfMonth

    val gDaysInMonth = intArrayOf(0, 31, if ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    val gy2 = if (gm > 2) (gy + 1) else gy
    var gDayNo = 365 * gy + (gy2 + 3) / 4 - (gy2 + 99) / 100 + (gy2 + 399) / 400 - 80
    for (i in 0 until gm) {
        gDayNo += gDaysInMonth[i]
    }
    gDayNo += gd

    val jnp = gDayNo / 12053
    gDayNo %= 12053

    var jy = 979 + 33 * jnp + 4 * (gDayNo / 1461)
    gDayNo %= 1461

    if (gDayNo >= 366) {
        jy += (gDayNo - 1) / 365
        gDayNo = (gDayNo - 1) % 365
    }

    val jm: Int
    val jd: Int
    if (gDayNo < 186) {
        jm = 1 + (gDayNo / 31)
        jd = 1 + (gDayNo % 31)
    } else {
        jm = 7 + ((gDayNo - 186) / 30)
        jd = 1 + ((gDayNo - 186) % 30)
    }

    return JalaliDate(jy, jm, jd)
}

fun LocalDate.toPersianDate(): String = toJalali().format()
fun LocalTime.toPersianTime(): String = String.format(Locale.US, "%02d:%02d", hour, minute).toPersianDigits()
