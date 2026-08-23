package com.karvin.app.presentation.role_selection

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.karvin.app.R
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinLogo
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy100
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun RoleSelectionScreen(
    onSelectRole: (UserRole) -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            KarvinLogo(
                size = 84.dp,
                showText = true,
                showSlogan = true
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = stringResource(id = R.string.welcome_title),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = stringResource(id = R.string.choose_role_prompt),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondaryLight,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Worker Choice Card
            RoleCard(
                title = stringResource(id = R.string.role_worker_title),
                description = stringResource(id = R.string.role_worker_desc),
                icon = Icons.Default.Engineering,
                iconBg = Emerald100,
                iconTint = Emerald600,
                buttonText = "ورود یا ثبت‌نام کارگر",
                buttonType = KarvinButtonType.SECONDARY,
                onButtonClick = { onSelectRole(UserRole.WORKER) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Employer Choice Card
            RoleCard(
                title = stringResource(id = R.string.role_employer_title),
                description = stringResource(id = R.string.role_employer_desc),
                icon = Icons.Default.BusinessCenter,
                iconBg = Navy100,
                iconTint = Navy900,
                buttonText = "ورود یا ثبت‌نام کارفرما",
                buttonType = KarvinButtonType.PRIMARY,
                onButtonClick = { onSelectRole(UserRole.EMPLOYER) }
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Text(
                text = stringResource(id = R.string.terms_notice),
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondaryLight,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun RoleCard(
    title: String,
    description: String,
    icon: ImageVector,
    iconBg: androidx.compose.ui.graphics.Color,
    iconTint: androidx.compose.ui.graphics.Color,
    buttonText: String,
    buttonType: KarvinButtonType,
    onButtonClick: () -> Unit
) {
    KarvinCard(
        modifier = Modifier.fillMaxWidth(),
        shapeRadius = 18.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondaryLight,
                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight
            )

            Spacer(modifier = Modifier.height(18.dp))

            KarvinButton(
                text = buttonText,
                onClick = onButtonClick,
                type = buttonType,
                height = 46.dp,
                shapeRadius = 12.dp
            )
        }
    }
}
