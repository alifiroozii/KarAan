package com.karvin.app.feature.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.karvin.app.core.network.MobileDashboardSync
import com.karvin.app.core.navigation.Routes

private val SPECIALTY_CATEGORIES = listOf(
    "تاسیسات و لوله‌کشی",
    "برقکاری و روشنایی",
    "نظافت و بهداشت",
    "نقاشی و دکوراسیون",
    "بنایی و گچ‌کاری",
    "مکانیک و امداد خودرو",
    "باغبانی و فضای سبز",
    "حمل بار و ترابری",
    "نجاری و کابینت"
)

private val COMMON_RATES = listOf(
    "توافقی",
    "ساعتی ۱۵۰,۰۰۰ تومان",
    "ساعتی ۲۰۰,۰۰۰ تومان",
    "پروژه‌ای ۲۵۰,۰۰۰ تومان",
    "پروژه‌ای ۳۵۰,۰۰۰ تومان"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateServiceScreen(navController: NavHostController) {
    val context = LocalContext.current

    var title by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(SPECIALTY_CATEGORIES[0]) }
    var rate by remember { mutableStateOf("توافقی") }
    var phone by remember { mutableStateOf(MobileDashboardSync.activePhone.ifBlank { "09121112233" }) }
    var city by remember { mutableStateOf("تهران") }
    var address by remember { mutableStateOf("تهران، میدان انقلاب") }
    var details by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "ثبت سرویس و اعلام آمادگی",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "نمایش مستقیم در نقشه و لیست کارفرمایان",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "بازگشت")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(Modifier.height(4.dp))
                // Hero Banner
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF0D9488).copy(alpha = 0.12f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF0D9488),
                            modifier = Modifier.size(46.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.Build,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "شما به عنوان متخصص فعالیت می‌کنید",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF0F766E)
                            )
                            Text(
                                "سرویس خود را ثبت کنید تا کارفرمایان نزدیک شما را ببینند و مستقیماً درخواست کار ارسال کنند.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF115E59)
                            )
                        }
                    }
                }
            }

            // 1. عنوان خدمت
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "عنوان تخصص یا خدمت شما *",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        placeholder = { Text("مثال: تعمیرات پکیج و کولر آبی، سیم‌کشی ساختمان...") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true,
                        leadingIcon = {
                            Icon(Icons.Default.Work, contentDescription = null, tint = Color(0xFF0D9488))
                        }
                    )
                }
            }

            // 2. دسته‌بندی تخصص
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "دسته‌بندی تخصص *",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SPECIALTY_CATEGORIES.forEach { cat ->
                            val isSelected = selectedCategory == cat
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedCategory = cat },
                                label = { Text(cat, fontSize = 12.sp) },
                                shape = RoundedCornerShape(10.dp),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF0D9488),
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }

            // 3. دستمزد پیشنهادی
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "نرخ یا دستمزد پیشنهادی",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedTextField(
                        value = rate,
                        onValueChange = { rate = it },
                        placeholder = { Text("مثال: توافقی یا ۲۰۰,۰۰۰ تومان") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true,
                        leadingIcon = {
                            Icon(Icons.Default.Payments, contentDescription = null, tint = Color(0xFF0D9488))
                        }
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        COMMON_RATES.forEach { commonRate ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (rate == commonRate) Color(0xFF0D9488).copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.clickable { rate = commonRate }
                            ) {
                                Text(
                                    commonRate,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    fontSize = 11.sp,
                                    color = if (rate == commonRate) Color(0xFF0D9488) else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // 4. شماره تماس متخصص
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "شماره تماس مستقیم جهت هماهنگی کارفرما *",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        placeholder = { Text("09xxxxxxxxx") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        leadingIcon = {
                            Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF0D9488))
                        }
                    )
                }
            }

            // 5. محدوده فعالیت
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "محدوده فعالیت و آدرس استقرار",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        placeholder = { Text("مثال: تهران، میدان انقلاب و کارگر جنوبی") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true,
                        leadingIcon = {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFF0D9488))
                        }
                    )
                }
            }

            // 6. توضیحات و مهارت‌ها
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "توضیحات تکمیلی یا ابزار کار (اختیاری)",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedTextField(
                        value = details,
                        onValueChange = { details = it },
                        placeholder = { Text("توضیح کوتاه درباره سابقه کار، دستگاه‌ها و ابزار مجهز همراه...") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        minLines = 3,
                        maxLines = 5
                    )
                }
            }

            // Submit Button
            item {
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        if (title.isBlank()) {
                            Toast.makeText(context, "لطفاً عنوان خدمت خود را وارد کنید", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (phone.isBlank()) {
                            Toast.makeText(context, "شماره تماس الزامی است", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        isSubmitting = true
                        MobileDashboardSync.syncProviderServiceCreated(
                            title = title.trim(),
                            category = selectedCategory,
                            rate = rate.trim(),
                            city = city.trim(),
                            address = address.trim(),
                            details = details.trim(),
                            userPhone = phone.trim(),
                            lat = 35.7008,
                            lng = 51.3912,
                            onSuccess = {
                                isSubmitting = false
                                Toast.makeText(
                                    context,
                                    "✓ خدمت شما ثبت شد و روی نقشه کارفرمایان فعال گردید",
                                    Toast.LENGTH_LONG
                                ).show()
                                navController.navigate(Routes.ProviderHome) {
                                    popUpTo(Routes.ProviderHome) { inclusive = true }
                                }
                            }
                        )
                    },
                    enabled = !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF0D9488)
                    )
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                            Text(
                                "ثبت رسمی سرویس و اعلام آمادگی به کارفرمایان",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}
