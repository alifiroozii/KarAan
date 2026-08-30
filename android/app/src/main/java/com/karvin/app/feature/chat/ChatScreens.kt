package com.karvin.app.feature.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.ErrorState
import com.karvin.app.core.designsystem.KarvinScaffold
import com.karvin.app.core.designsystem.LoadingState
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun ChatListScreen(
    navController: NavHostController,
    role: UserRole = UserRole.PROVIDER,
    viewModel: ChatListViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    KarvinScaffold(navController, role, content = { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
        AppTopBar("پیام‌ها", onBack = { navController.popBackStack() })
        when { state.loading -> LoadingState(); state.error != null -> ErrorState(state.error.orEmpty()) { }; state.conversations.isEmpty() -> EmptyState("هنوز گفت‌وگویی ندارید", "بعد از ارسال یا پذیرش پیشنهاد، گفت‌وگوها اینجا قرار می‌گیرند."); else -> LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { items(state.conversations, key = { it.id }) { conversation -> Surface(onClick = { navController.navigate(Routes.conversation(conversation.id)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.surfaceVariant) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(conversation.participant, size = 52.dp); Column(Modifier.weight(1f).padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) { Text(conversation.participant.name, style = MaterialTheme.typography.titleMedium); Text(conversation.lastMessage?.text ?: "گفت‌وگو را شروع کنید", maxLines = 1, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall) }; if (conversation.unreadCount > 0) Box(Modifier.size(24.dp).clip(androidx.compose.foundation.shape.CircleShape).background(MaterialTheme.colorScheme.primary), contentAlignment = Alignment.Center) { Text(conversation.unreadCount.toString().toPersianDigits(), color = Color.White, style = MaterialTheme.typography.labelSmall) } } } } } }
        }
    })
}

@Composable
fun ConversationScreen(navController: NavHostController, conversationId: String, viewModel: ConversationViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var text by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    LaunchedEffect(conversationId) { viewModel.load(conversationId) }
    LaunchedEffect(state.messages.size) { if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.lastIndex) }
    KarvinScaffold(navController, UserRole.PROVIDER, content = { padding ->
    Column(Modifier.fillMaxSize().padding(padding).imePadding()) {
        AppTopBar("گفت‌وگو", onBack = { navController.popBackStack() })
        when {
            state.loading -> LoadingState()
            state.error != null && state.messages.isEmpty() -> ErrorState(state.error.orEmpty()) { viewModel.load(conversationId) }
            state.messages.isEmpty() -> EmptyState("گفت‌وگو خالی است", "پیام خود را برای شروع بنویسید.")
            else -> LazyColumn(Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp), state = listState, verticalArrangement = Arrangement.spacedBy(8.dp)) { items(state.messages, key = { it.id }) { message -> MessageBubble(message) } }
        }
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = text, onValueChange = { text = it }, placeholder = { Text("پیام خود را بنویسید") }, modifier = Modifier.weight(1f), maxLines = 3)
            IconButton(onClick = { viewModel.send(conversationId, text); text = "" }, enabled = text.isNotBlank(), modifier = Modifier.semantics { contentDescription = "ارسال پیام" }) { Icon(Icons.AutoMirrored.Filled.Send, "ارسال") }
        }
    }
    })
}

@Composable
private fun MessageBubble(message: ChatMessage) {
    val mine = message.senderId == com.karvin.app.data.FakeData.workers.first().id
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.Start else Arrangement.End) {
        Column(horizontalAlignment = if (mine) Alignment.Start else Alignment.End) {
            Surface(color = if (mine) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(16.dp)) { Text(message.text, Modifier.padding(horizontal = 14.dp, vertical = 10.dp), style = MaterialTheme.typography.bodyLarge) }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 3.dp)) { Text(message.sentAt.format(DateTimeFormatter.ofPattern("HH:mm", Locale.US)).toPersianDigits(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant); if (mine) { Icon(Icons.Default.DoneAll, "دیده شد", tint = if (message.isSeen) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(15.dp).padding(start = 3.dp)) } }
        }
    }
}
