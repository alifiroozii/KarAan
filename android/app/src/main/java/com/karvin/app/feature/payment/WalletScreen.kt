package com.karvin.app.feature.payment

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.common.UiState
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.KarvinScaffold
import com.karvin.app.core.designsystem.StatefulContent
import com.karvin.app.domain.model.*

@Composable
fun WalletScreen(navController: NavHostController, viewModel: WalletViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var amount by remember { mutableStateOf("") }
    var withdraw by remember { mutableStateOf(false) }
    val context = LocalContext.current
    KarvinScaffold(navController, UserRole.REQUESTER, content = { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            AppTopBar("کیف پول", onBack = { navController.popBackStack() })
            LazyColumn(Modifier.fillMaxSize().padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    StatefulContent(state.wallet, onRetry = viewModel::reload) { wallet ->
                        Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) { Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text("موجودی فعلی", style = MaterialTheme.typography.titleMedium); Text("${wallet.balance} ${wallet.currency}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary) } }
                    }
                }
                item { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { Button(onClick = { withdraw = false }, modifier = Modifier.weight(1f)) { Text("افزایش موجودی") }; OutlinedButton(onClick = { withdraw = true }, modifier = Modifier.weight(1f)) { Text("تسویه حساب") } } }
                item { OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
                item { Button(onClick = { val value = amount.toLongOrNull() ?: return@Button; if (withdraw) viewModel.withdraw(value) else viewModel.deposit(value) { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) } }, modifier = Modifier.fillMaxWidth(), enabled = amount.isNotBlank()) { Text(if (withdraw) "ثبت تسویه" else "ورود به درگاه پرداخت") } }
                item { Text("تراکنش‌ها", style = MaterialTheme.typography.titleLarge) }
                item { StatefulContent(state.transactions, onRetry = viewModel::reload) { transactions -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { transactions.forEach { transaction -> ListItem(headlineContent = { Text(transaction.description) }, supportingContent = { Text(transaction.createdAt) }, trailingContent = { Text(transaction.amount.toString()) }) } } } }
            }
        }
    })
}
