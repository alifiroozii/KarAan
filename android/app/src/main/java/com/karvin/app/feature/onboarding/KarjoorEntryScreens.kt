package com.karvin.app.feature.onboarding

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
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
            .padding(horizontal = KarjoorDimensions.screenGutter),
    ) {
        Spacer(Modifier.height(KarjoorDimensions.spacing24))

        KarjoorLogo(markSize = 44.dp, showSubtitle = true)

        Spacer(Modifier.height(KarjoorDimensions.spacing32))

        Text(
            text = "با کارجور، چه کاری می‌خوای انجام بدی؟",
            style = MaterialTheme.typography.headlineSmall,
            color = KarjoorColors.TextPrimary,
        )
        Spacer(Modifier.height(KarjoorDimensions.spacing8))
        Text(
            text = "هر نقشی رو انتخاب کنی، تا زمان لاگ‌اوت در اون باقی می‌مونی.",
            style = MaterialTheme.typography.bodyMedium,
            color = KarjoorColors.TextSecondary,
        )

        Spacer(Modifier.height(20.dp))

        // 100% Free Service Badge
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = KarjoorColors.Primary.copy(alpha = 0.08f),
            border = androidx.compose.foundation.BorderStroke(1.dp, KarjoorColors.Primary.copy(alpha = 0.2f)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "سرویس کارجور فعلاً کاملاً رایگان است (بدون کارمزد)",
                    style = MaterialTheme.typography.labelMedium,
                    color = KarjoorColors.Primary,
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        KarjoorRoleCard(
            title = "می‌خواهم کار پیدا کنم",
            description = "فرصت‌های کاری را ببین و برای انجام آن‌ها درخواست بده.",
            badge = "انجام‌دهنده",
            accent = KarjoorColors.Secondary,
            onClick = { onRoleSelected(KarjoorRole.PERFORMER) },
        )

        Spacer(Modifier.height(KarjoorDimensions.spacing16))

        KarjoorRoleCard(
            title = "برای کارم نیرو می‌خواهم",
            description = "کارت را ثبت کن و فرد مناسب را پیدا کن.",
            badge = "درخواست‌دهنده",
            accent = KarjoorColors.Primary,
            onClick = { onRoleSelected(KarjoorRole.REQUESTER) },
        )

        Spacer(Modifier.weight(1f))
        Spacer(Modifier.height(KarjoorDimensions.spacing24))
    }
}

@Composable
private fun KarjoorRoleCard(
    title: String,
    description: String,
    badge: String,
    accent: Color,
    onClick: () -> Unit,
) {
    KarjoorCard(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        borderColor = accent.copy(alpha = 0.35f),
        contentDescription = "$title — $badge",
    ) {
        Row(
            Modifier.padding(KarjoorDimensions.spacing20),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = RoundedCornerShape(KarjoorDimensions.cornerMedium),
                color = accent.copy(alpha = 0.12f),
                modifier = Modifier.size(56.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = badge.take(1),
                        style = MaterialTheme.typography.titleLarge,
                        color = accent,
                    )
                }
            }

            Spacer(Modifier.width(KarjoorDimensions.spacing16))

            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = KarjoorColors.TextPrimary,
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = KarjoorColors.TextSecondary,
                )
                Spacer(Modifier.height(KarjoorDimensions.spacing4))
                KarjoorStatusPill(badge, accent)
            }
        }
    }
}
