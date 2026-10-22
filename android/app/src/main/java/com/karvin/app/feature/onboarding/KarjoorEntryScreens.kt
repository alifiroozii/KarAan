package com.karvin.app.feature.onboarding

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.HeadsetMic
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.PostAdd
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.core.designsystem.KarjoorCard
import com.karvin.app.core.designsystem.KarjoorColors
import com.karvin.app.core.designsystem.KarjoorDimensions
import com.karvin.app.core.designsystem.KarjoorLogo
import com.karvin.app.core.designsystem.KarjoorMark
import com.karvin.app.core.designsystem.KarjoorPrimaryButton
import com.karvin.app.core.designsystem.KarjoorRole
import com.karvin.app.core.designsystem.KarjoorSplashMark
import com.karvin.app.core.designsystem.KarjoorStatusPill
import com.karvin.app.core.designsystem.KarjoorTextButton
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * KARJOOR first-run experience: Splash → Onboarding → Role selection.
 *
 * These live together because they share one visual language and are only ever
 * reached in sequence; splitting them lets the onboarding drift from the splash.
 */

// ─────────────────────────────── Splash ───────────────────────────────

/**
 * Splash screen: light background, the KARJOOR mark animating its two arms into
 * convergence, the Persian name, then a short hand-off. The delay is capped so
 * the app never feels slow to start.
 */
@Composable
fun KarjoorSplashScreen(onFinished: () -> Unit) {
    var ready by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(900)
        ready = true
        delay(400)
        onFinished()
    }

    val scale by animateFloatAsState(
        targetValue = if (ready) 1f else 0.92f,
        animationSpec = tween(durationMillis = 700),
        label = "karjoor-splash-scale",
    )

    Box(
        Modifier
            .fillMaxSize()
            .background(KarjoorColors.Background),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing20),
        ) {
            KarjoorSplashMark(size = 112.dp, modifier = Modifier.scale(scale))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "کارجور",
                    style = MaterialTheme.typography.displaySmall,
                    color = KarjoorColors.TextPrimary,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                )
                Spacer(Modifier.height(KarjoorDimensions.spacing4))
                Text(
                    text = "سامانه هوشمند اشتغال و خدمات آنلاین",
                    style = MaterialTheme.typography.labelMedium,
                    color = KarjoorColors.TextSecondary,
                )
            }
        }
    }
}

// ─────────────────────────────── Onboarding ───────────────────────────────

/** A single onboarding page. Copy is fixed by the product spec. */
private data class OnboardingPage(
    val title: String,
    val description: String,
    val accent: Color,
)

private val onboardingPages = listOf(
    OnboardingPage(
        title = "فرصت‌های کاری نزدیکت رو پیدا کن",
        description = "کارهای اطرافت رو ببین، فیلتر کن و برای هر کدوم که بلدی درخواست بفرست.",
        accent = KarjoorColors.Primary,
    ),
    OnboardingPage(
        title = "برای کارت نیروی مناسب پیدا کن",
        description = "درخواستت رو ثبت کن، مشخصات متقاضیا رو ببین و فرد مناسب رو انتخاب کن.",
        accent = KarjoorColors.Secondary,
    ),
    OnboardingPage(
        title = "در کارجور، کارها راحت‌تر جور می‌شن",
        description = "پیام‌رسانی، پیگیری وضعیت و تسویه، همه در یک جا.",
        accent = KarjoorColors.Navy,
    ),
)

@Composable
fun KarjoorOnboardingScreen(onFinished: () -> Unit) {
    val pagerState = rememberPagerState { onboardingPages.size }
    val coroutineScope = androidx.compose.runtime.rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(KarjoorColors.Background)
            .padding(horizontal = KarjoorDimensions.screenGutter, vertical = KarjoorDimensions.spacing16),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            KarjoorLogo(markSize = 36.dp)
            KarjoorTextButton(
                text = "رد کردن",
                onClick = onFinished,
            )
        }

        Spacer(Modifier.height(KarjoorDimensions.spacing24))

        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
        ) { pageIndex ->
            val page = onboardingPages[pageIndex]
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = page.accent.copy(alpha = 0.08f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, page.accent.copy(alpha = 0.2f)),
                    modifier = Modifier.size(170.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        KarjoorMark(
                            size = 80.dp,
                            spineColor = page.accent,
                            requesterColor = page.accent,
                            performerColor = KarjoorColors.Navy,
                        )
                    }
                }

                Spacer(Modifier.height(KarjoorDimensions.spacing32))

                Text(
                    text = page.title,
                    style = MaterialTheme.typography.headlineMedium,
                    color = KarjoorColors.TextPrimary,
                    textAlign = TextAlign.Center,
                )

                Spacer(Modifier.height(KarjoorDimensions.spacing12))

                Text(
                    text = page.description,
                    style = MaterialTheme.typography.bodyLarge,
                    color = KarjoorColors.TextSecondary,
                    textAlign = TextAlign.Center,
                )
            }
        }

        // Pager indicators
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = KarjoorDimensions.spacing16),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            repeat(onboardingPages.size) { index ->
                val isSelected = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .height(8.dp)
                        .width(if (isSelected) 24.dp else 8.dp)
                        .background(
                            color = if (isSelected) KarjoorColors.Primary else KarjoorColors.Outline,
                            shape = CircleShape,
                        ),
                )
            }
        }

        Spacer(Modifier.height(KarjoorDimensions.spacing8))

        KarjoorPrimaryButton(
            text = if (pagerState.currentPage == onboardingPages.lastIndex) "شروع کار در کارجور" else "بعدی",
            onClick = {
                if (pagerState.currentPage < onboardingPages.lastIndex) {
                    kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launchWhenResumedOrLaunch(coroutineScope, pagerState)
                } else {
                    onFinished()
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(KarjoorDimensions.spacing8))
    }
}

private fun kotlinx.coroutines.CoroutineScope.launchWhenResumedOrLaunch(
    scope: kotlinx.coroutines.CoroutineScope,
    pagerState: androidx.compose.foundation.pager.PagerState,
) {
    scope.launch {
        pagerState.animateScrollToPage(pagerState.currentPage + 1)
    }
}


// ──────────────────────── Role Selection ────────────────────────

/**
 * Role selection — the fork between the two marketplaces.
 *
 * Both cards are deliberately the same size, weight and elevation. Neither may
 * look like a secondary option or a sub-account: a Requester is as primary as a
 * Performer. Each card carries its role badge so the choice is explicit before
 * the user commits.
 *
 * @param onRoleSelected the chosen role; shared phone login follows.
 */
@Composable
fun KarjoorRoleSelectionScreen(
    onRoleSelected: (KarjoorRole) -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .background(KarjoorColors.Background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp),
    ) {
        Spacer(Modifier.height(16.dp))

        // 1. Google Stitch Top Header Bar (مرحله ۱ از ۲, کارجور, دکمه بستن)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Right (in RTL): Close Button
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.size(38.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "بستن",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Center: Screen Title & Step
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(KarjoorColors.Secondary))
                    Text(
                        "انتخاب نقش",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }
                Text(
                    "مرحله ۱ از ۲",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp,
                )
            }

            // Left (in RTL): Minimal Karjoor Brand Pill
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    KarjoorMark(size = 16.dp)
                    Text(
                        "کارجور",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // 2. Welcoming Header Cluster (Google Stitch Standard)
        Surface(
            shape = RoundedCornerShape(9999.dp),
            color = KarjoorColors.Secondary.copy(alpha = 0.12f),
            border = BorderStroke(1.dp, KarjoorColors.Secondary.copy(alpha = 0.25f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(
                    Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = KarjoorColors.Secondary,
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    "شروع مسیر در کارجور",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = KarjoorColors.Secondary,
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        Text(
            text = "با کارجور، چه کاری می‌خوای انجام بدی؟",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 20.sp,
        )

        Spacer(Modifier.height(4.dp))

        Text(
            text = "هر زمان که بخواهی می‌توانی نقش خود را تغییر دهی یا هر دو را همزمان در حساب کاربری‌ات فعال داشته باشی.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            lineHeight = 20.sp,
        )

        Spacer(Modifier.height(18.dp))

        // 3. Role Card 1: Performer / Specialist (انجام‌دهنده) - Stitch Design
        StitchPerformerCard(
            onClick = { onRoleSelected(KarjoorRole.PERFORMER) }
        )

        Spacer(Modifier.height(14.dp))

        // 4. Role Card 2: Requester / Employer (درخواست‌دهنده) - Stitch Design
        StitchRequesterCard(
            onClick = { onRoleSelected(KarjoorRole.REQUESTER) }
        )

        Spacer(Modifier.height(16.dp))

        // 5. Trust Guarantee Micro-Strip
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                    modifier = Modifier.size(36.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.VerifiedUser,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        "قرارداد رسمی و حساب تضمینی",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        "حفاظت کامل از حقوق مالی هر دو طرف",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // 6. Support Footer Pill
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        Icons.Default.HeadsetMic,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        "نیاز به راهنمایی داری؟ پشتیبانی ۲۴/۷ کارجور",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    "گفتگو ←",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun StitchPerformerCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.2.dp, KarjoorColors.Secondary.copy(alpha = 0.40f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Top Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = KarjoorColors.Secondary.copy(alpha = 0.12f),
                        border = BorderStroke(1.dp, KarjoorColors.Secondary.copy(alpha = 0.25f)),
                        modifier = Modifier.size(46.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Work,
                                contentDescription = null,
                                tint = KarjoorColors.Secondary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(
                                "انجام‌دهنده",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                            Text(
                                "| Performer",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outlineVariant,
                                fontSize = 10.sp,
                            )
                        }
                        Text(
                            "متخصص، فریلنسر، کارجو",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = KarjoorColors.Secondary,
                        )
                    }
                }

                // Verified Instant Payout Tag
                Surface(
                    shape = RoundedCornerShape(9999.dp),
                    color = KarjoorColors.Secondary.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, KarjoorColors.Secondary.copy(alpha = 0.25f)),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Icon(
                            Icons.Default.Verified,
                            contentDescription = null,
                            tint = KarjoorColors.Secondary,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            "تسویه آنی",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = KarjoorColors.Secondary,
                            fontSize = 10.sp,
                        )
                    }
                }
            }

            // Body
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    "می‌خواهم کار پیدا کنم",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    "فرصت‌های کاری تایید شده را ببین، پیشنهاد قیمت بفرست و با ضمانت مالی پروژه بگیر.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 20.sp,
                )
            }

            // Feature Tag Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                StitchFeaturePill(Icons.Default.Payments, "درآمد نامحدود", KarjoorColors.Secondary)
                StitchFeaturePill(Icons.Default.Lock, "پرداخت امن", KarjoorColors.Secondary)
                StitchFeaturePill(Icons.Default.Tune, "سفارشی", KarjoorColors.Secondary)
            }

            // Action CTA Button
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF1E293B), // Dark inverse-surface
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(
                            Icons.Default.Search,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            "پیدا کردن کار",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                    }
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun StitchRequesterCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.2.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.40f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Top Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
                        modifier = Modifier.size(46.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.BusinessCenter,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(
                                "درخواست‌دهنده",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                            Text(
                                "| Requester",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outlineVariant,
                                fontSize = 10.sp,
                            )
                        }
                        Text(
                            "کارفرما، صاحب کسب‌وکار",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }

                // Escrow Shield Tag
                Surface(
                    shape = RoundedCornerShape(9999.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Icon(
                            Icons.Default.Security,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            "صندوق امانی",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 10.sp,
                        )
                    }
                }
            }

            // Body
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    "برای کارم نیرو می‌خواهم",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    "سفارش یا پروژه‌ات را رایگان ثبت کن، پیشنهادها را بسنج و بهترین نیرو را انتخاب کن.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 20.sp,
                )
            }

            // Feature Tag Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                StitchFeaturePill(Icons.Default.Group, "بهترین متخصصان", MaterialTheme.colorScheme.primary)
                StitchFeaturePill(Icons.Default.AccountBalance, "حساب امن مالی", MaterialTheme.colorScheme.primary)
                StitchFeaturePill(Icons.Default.HeadsetMic, "پشتیبانی ۲۴/۷", MaterialTheme.colorScheme.primary)
            }

            // Action CTA Button
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(
                            Icons.Default.PostAdd,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            "ثبت درخواست کار",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                    }
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun StitchFeaturePill(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    tint: Color,
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        border = BorderStroke(0.8.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(12.dp)
            )
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp,
            )
        }
    }
}
