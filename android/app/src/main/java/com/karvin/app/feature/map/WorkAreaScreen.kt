package com.karvin.app.feature.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.feature.home.DefaultHomePoint

/** تنظیمات محدوده فعالیت — طرح صفحه ۵ مسیر ارائه‌دهنده. */
@Composable
fun WorkAreaScreen(navController: NavHostController) {
    var radius by remember { mutableStateOf(5) }
    var saved by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("محدوده فعالیت شما", onBack = { navController.popBackStack() })
        Box(
            Modifier.weight(1f).fillMaxWidth().background(Color(0xFFF1EFFF)),
            contentAlignment = Alignment.Center,
        ) {
            Card(
                shape = CircleShape,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = .10f)),
                border = androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary.copy(alpha = .55f)),
                modifier = Modifier.fillMaxWidth((0.28f + radius / 32f).coerceAtMost(.88f)).aspectRatio(1f),
            ) {}
            Card(
                shape = CircleShape,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.size(56.dp).semantics { contentDescription = "موقعیت شما" },
            ) {
                Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.LocationOn, null, tint = Color.White) }
            }
            Card(shape = RoundedCornerShape(14.dp), modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)) {
                Text(
                    "موقعیت نمایشی شما · ${DefaultHomePoint.latitude}, ${DefaultHomePoint.longitude}",
                    Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
        Column(Modifier.navigationBarsPadding().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("محدوده‌ای را انتخاب کنید که درخواست‌های خدمات را دریافت کنید.", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(1, 5, 10, 20).forEach { value ->
                    FilterChip(
                        selected = radius == value,
                        onClick = { radius = value; saved = false },
                        label = { Text("${value.toString().toPersianDigits()} کیلومتر") },
                        leadingIcon = {
                            RadioButton(selected = radius == value, onClick = null)
                        },
                        colors = FilterChipDefaults.filterChipColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.semantics { contentDescription = "محدوده ${value.toString().toPersianDigits()} کیلومتر" },
                    )
                }
            }
            Button(
                onClick = { saved = true },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
            ) { Text(if (saved) "ذخیره شد ✓" else "ذخیره", color = MaterialTheme.colorScheme.onSecondary) }
        }
    }
}
