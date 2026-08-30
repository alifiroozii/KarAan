package com.karvin.app.feature.payment

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.KarvinScaffold
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.StatefulContent
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.model.toTomanString

@Composable
fun WalletScreen(
    navController: NavHostController,
    viewModel: WalletViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var amount by remember { mutableStateOf("") }
    var withdraw by remember { mutableStateOf(false) }
    val context = LocalContext.current

    KarvinScaffold(navController, UserRole.REQUESTER, content = { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            AppTopBar("کیف پول و تراکنش‌ها", onBack = { navController.popBackStack() })

            LazyColumn(
                Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                // Balance card
                item {
                    StatefulContent(state.wallet, onRetry = viewModel::reload) { wallet ->
                        Card(
                            Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        ) {
                            Column(
                                Modifier.padding(24.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Icon(
                                        Icons.Default.AccountBalanceWallet,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                    )
                                    Text("موجودی حساب", style = MaterialTheme.typography.titleMedium)
                                }
                                Text(
                                    wallet.balance.toTomanString(),
                                    style = MaterialTheme.typography.headlineLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    }
                }

                // Action tabs
                item {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Button(
                            onClick = { withdraw = false },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (!withdraw) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                contentColor = if (!withdraw) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                        ) {
                            Text("افزایش موجودی")
                        }

                        Button(
                            onClick = { withdraw = true },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (withdraw) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                contentColor = if (withdraw) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                        ) {
                            Text("تسویه حساب")
                        }
                    }
                }

                // Amount input
                item {
                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it.filter(Char::isDigit) },
                        label = { Text(if (withdraw) "مبلغ تسویه (تومان)" else "مبلغ افزایش موجودی (تومان)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    )
                }

                // Submit button
                item {
                    PrimaryButton(
                        text = if (withdraw) "ثبت درخواست تسویه" else "ورود به درگاه پرداخت شاپرک",
                        onClick = {
                            val value = amount.toLongOrNull() ?: return@PrimaryButton
                            if (withdraw) {
                                viewModel.withdraw(value)
                            } else {
                                viewModel.deposit(value) { url ->
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                }
                            }
                            amount = ""
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = amount.isNotBlank() && (amount.toLongOrNull() ?: 0L) > 0,
                    )
                }

                // Transactions history
                item {
                    Text("تاریخچه تراکنش‌ها", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }

                item {
                    StatefulContent(state.transactions, onRetry = viewModel::reload) { transactions ->
                        if (transactions.isEmpty()) {
                            EmptyState("تراکنشی یافت نشد", "هنوز تراکنشی در کیف پول شما ثبت نشده است.")
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                transactions.forEach { transaction ->
                                    val isDeposit = transaction.amount > 0
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(16.dp),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(40.dp)
                                                    .clip(CircleShape)
                                                    .background(
                                                        if (isDeposit) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                                                        else MaterialTheme.colorScheme.error.copy(alpha = 0.15f)
                                                    ),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Icon(
                                                    if (isDeposit) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                                                    contentDescription = null,
                                                    tint = if (isDeposit) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                                    modifier = Modifier.size(20.dp),
                                                )
                                            }

                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(transaction.description, style = MaterialTheme.typography.titleSmall)
                                                Text(
                                                    transaction.createdAt.toPersianDigits(),
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                )
                                            }

                                            Text(
                                                transaction.amount.toTomanString(),
                                                style = MaterialTheme.typography.titleMedium,
                                                color = if (isDeposit) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                                fontWeight = FontWeight.Bold,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    })
}

