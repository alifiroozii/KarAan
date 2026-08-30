package com.karvin.app.feature.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.core.common.ApiResult
import com.karvin.app.core.common.UiState
import com.karvin.app.domain.model.Wallet
import com.karvin.app.domain.model.WalletTransaction
import com.karvin.app.domain.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WalletUiState(val wallet: UiState<Wallet> = UiState.Loading, val transactions: UiState<List<WalletTransaction>> = UiState.Loading, val operationError: String? = null)

@HiltViewModel
class WalletViewModel @Inject constructor(private val repository: PaymentRepository) : ViewModel() {
    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state.asStateFlow()
    init { reload() }
    fun reload() = viewModelScope.launch {
        _state.value = _state.value.copy(wallet = UiState.Loading, transactions = UiState.Loading)
        val wallet = repository.wallet()
        val transactions = repository.transactions()
        _state.value = _state.value.copy(wallet = wallet.toUi(), transactions = transactions.toUi())
    }
    fun deposit(amount: Long, openGateway: (String) -> Unit) = viewModelScope.launch {
        when (val result = repository.startDeposit(amount)) { is ApiResult.Success -> openGateway(result.data.redirectUrl); is ApiResult.Error -> _state.value = _state.value.copy(operationError = result.message); else -> Unit }
    }
    fun withdraw(amount: Long) = viewModelScope.launch { repository.withdraw(amount); reload() }
    private fun <T> ApiResult<T>.toUi(): UiState<T> = when (this) { ApiResult.Loading -> UiState.Loading; is ApiResult.Success -> UiState.Success(data); is ApiResult.Error -> UiState.Error(message) }
}
