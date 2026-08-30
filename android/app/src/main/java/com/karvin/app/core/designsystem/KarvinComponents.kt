package com.karvin.app.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun KarvinButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KarvinButtonVariant = KarvinButtonVariant.Primary,
    loading: Boolean = false,
    enabled: Boolean = true,
) {
    val content: @Composable RowScope.() -> Unit = {
        if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
        else Text(text, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
    }
    when (variant) {
        KarvinButtonVariant.Outlined -> OutlinedButton(onClick, modifier.height(KarvinDimensions.buttonHeight), enabled = enabled && !loading, shape = RoundedCornerShape(KarvinDimensions.cornerMedium), content = content)
        KarvinButtonVariant.Secondary -> Button(onClick, modifier.height(KarvinDimensions.buttonHeight), enabled = enabled && !loading, shape = RoundedCornerShape(KarvinDimensions.cornerMedium), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary), content = content)
        KarvinButtonVariant.Destructive -> Button(onClick, modifier.height(KarvinDimensions.buttonHeight), enabled = enabled && !loading, shape = RoundedCornerShape(KarvinDimensions.cornerMedium), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error), content = content)
        KarvinButtonVariant.Primary -> Button(onClick, modifier.height(KarvinDimensions.buttonHeight), enabled = enabled && !loading, shape = RoundedCornerShape(KarvinDimensions.cornerMedium), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary), content = content)
    }
}

enum class KarvinButtonVariant { Primary, Secondary, Outlined, Destructive }

@Composable
fun KarvinTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    error: String? = null,
    leadingIcon: (@Composable (() -> Unit))? = null,
    trailingIcon: (@Composable (() -> Unit))? = null,
    password: Boolean = false,
    otp: Boolean = false,
    enabled: Boolean = true,
) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = { Text(label) },
        isError = error != null,
        enabled = enabled,
        singleLine = true,
        shape = RoundedCornerShape(KarvinDimensions.cornerMedium),
        keyboardOptions = KeyboardOptions(keyboardType = if (otp) KeyboardType.Number else if (password) KeyboardType.Password else KeyboardType.Text),
        visualTransformation = if (password && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        leadingIcon = leadingIcon ?: if (password) ({ Icon(Icons.Rounded.Lock, null) }) else null,
        trailingIcon = trailingIcon ?: if (password) ({ IconButton(onClick = { visible = !visible }) { Icon(if (visible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility, null) } }) else null,
        supportingText = error?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
    )
}

@Composable
fun KarvinTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
) {
    Row(
        Modifier
            .fillMaxWidth()
            .height(KarvinDimensions.topBarHeight)
            .padding(horizontal = KarvinDimensions.spacing16),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, contentDescription = "بازگشت") }
        }
        Text(title, Modifier.weight(1f), style = MaterialTheme.typography.titleLarge)
        actions()
    }
}
