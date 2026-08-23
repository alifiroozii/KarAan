package com.karvin.app.presentation.wallet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Transaction
import com.karvin.app.domain.model.Wallet
import com.karvin.app.domain.repository.WalletRepository
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WalletUiState(
    val wallet: Wallet = Wallet("worker_default"),
    val transactions: List<Transaction> = emptyList(),
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val walletRepository: WalletRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WalletUiState())
    val uiState: StateFlow<WalletUiState> = _uiState.asStateFlow()

    init {
        loadWalletData()
    }

    private fun loadWalletData() {
        val userId = "worker_default"
        viewModelScope.launch {
            walletRepository.getWallet(userId).collect { w ->
                _uiState.value = _uiState.value.copy(wallet = w)
            }
        }

        viewModelScope.launch {
            walletRepository.getTransactions(userId).collect { txList ->
                _uiState.value = _uiState.value.copy(transactions = txList)
            }
        }
    }

    fun requestWithdrawal(amountToman: Long) {
        viewModelScope.launch {
            when (val res = walletRepository.requestWithdrawal("worker_default", amountToman)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست تسویه حساب به شماره شبا ثبت گردید و تا ۲۴ ساعت آینده واریز می‌شود.")
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}
