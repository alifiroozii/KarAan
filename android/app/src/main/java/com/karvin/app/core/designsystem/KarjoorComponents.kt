package com.karvin.app.core.designsystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * KARJOOR shared components — actions, surfaces and inputs.
 *
 * Every component reads colour, radius and spacing from [KarjoorColors] and
 * [MaterialTheme] tokens. Screens must not restyle these locally; that is what
 * keeps a card identical on the Performer dashboard and in the Requester job list.
 */

// ─────────────────────────────── Buttons ───────────────────────────────

/** Primary action. Only one per screen — the single thing the user came to do. */
@Composable
fun KarjoorPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(KarjoorDimensions.buttonHeight)
            .semantics { contentDescription = text },
        enabled = enabled && !loading,
        shape = RoundedCornerShape(KarjoorDimensions.cornerMedium),
        colors = ButtonDefaults.buttonColors(
            containerColor = KarjoorColors.Primary,
            contentColor = KarjoorColors.OnPrimary,
            disabledContainerColor = KarjoorColors.Outline,
            disabledContentColor = KarjoorColors.Surface,
        ),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = KarjoorColors.OnPrimary,
            )
        } else {
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

/** Secondary action — supporting paths, never the main call to action. */
@Composable
fun KarjoorSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(KarjoorDimensions.buttonHeight)
            .semantics { contentDescription = text },
        enabled = enabled,
        shape = RoundedCornerShape(KarjoorDimensions.cornerMedium),
        border = BorderStroke(1.dp, KarjoorColors.Border),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = KarjoorColors.Primary),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

/** Low-emphasis inline action. */
@Composable
fun KarjoorTextButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = KarjoorColors.Primary,
) {
    TextButton(onClick = onClick, modifier = modifier) {
        Text(text, style = MaterialTheme.typography.labelLarge, color = color)
    }
}

// ─────────────────────────────── Cards ───────────────────────────────

/**
 * Base KARJOOR card. White surface, single hairline border, one radius.
 *
 * [onClick] makes it interactive; pass null for static content so assistive
 * services do not announce a non-actionable surface as clickable.
 */
@Composable
fun KarjoorCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    containerColor: Color = KarjoorColors.Surface,
    borderColor: Color = KarjoorColors.Border,
    contentDescription: String? = null,
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(KarjoorDimensions.cornerCard)
    val semanticsModifier = contentDescription
        ?.let { Modifier.semantics { this.contentDescription = it } }
        ?: Modifier

    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier.then(semanticsModifier),
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = containerColor),
            border = BorderStroke(1.dp, borderColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) { content() }
    } else {
        Card(
            modifier = modifier.then(semanticsModifier),
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = containerColor),
            border = BorderStroke(1.dp, borderColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) { content() }
    }
}

/** Section header with an optional trailing action. */
@Composable
fun KarjoorSection(
    title: String,
    modifier: Modifier = Modifier,
    actionText: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = KarjoorColors.TextPrimary,
            modifier = Modifier.weight(1f),
        )
        if (actionText != null && onAction != null) {
            KarjoorTextButton(actionText, onAction)
        }
    }
}

// ─────────────────────────────── Inputs ───────────────────────────────

/** Single-line or multi-line text input with inline validation error. */
@Composable
fun KarjoorTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    error: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
) {
    Column(modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text(label, style = MaterialTheme.typography.bodyMedium) },
            placeholder = placeholder?.let {
                {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KarjoorColors.TextSecondary,
                    )
                }
            },
            isError = error != null,
            singleLine = singleLine,
            minLines = minLines,
            shape = RoundedCornerShape(KarjoorDimensions.cornerMedium),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            visualTransformation = VisualTransformation.None,
            supportingText = error?.let {
                {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.labelSmall,
                        color = KarjoorColors.Error,
                    )
                }
            },
        )
    }
}

// ─────────────────────────────── Chips ───────────────────────────────

/** Selectable filter chip. */
@Composable
fun KarjoorFilterChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Surface(
        modifier = modifier.semantics { contentDescription = text },
        onClick = onClick,
        shape = RoundedCornerShape(KarjoorDimensions.cornerSmall),
        color = if (selected) KarjoorColors.PrimaryContainer else KarjoorColors.Surface,
        border = BorderStroke(
            1.dp,
            if (selected) KarjoorColors.Primary else KarjoorColors.Border,
        ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (selected) KarjoorColors.Primary else KarjoorColors.TextSecondary,
                    modifier = Modifier.size(16.dp),
                )
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = if (selected) KarjoorColors.Primary else KarjoorColors.TextSecondary,
            )
        }
    }
}

// ───────────────────────── Status & meta ─────────────────────────

/** Job/application state pill. Colour comes from the status, not from the screen. */
@Composable
fun KarjoorStatusPill(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
    filled: Boolean = true,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(KarjoorDimensions.cornerSmall),
        color = if (filled) color.copy(alpha = 0.12f) else Color.Transparent,
        border = if (filled) null else BorderStroke(1.dp, color.copy(alpha = 0.4f)),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelMedium,
            color = color,
        )
    }
}

/** Small metadata row: optional icon plus a value. Used inside cards. */
@Composable
fun KarjoorMetaRow(
    value: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    iconTint: Color = KarjoorColors.TextSecondary,
    valueColor: Color = KarjoorColors.TextPrimary,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(14.dp))
        }
        Text(value, style = MaterialTheme.typography.bodySmall, color = valueColor)
    }
}

