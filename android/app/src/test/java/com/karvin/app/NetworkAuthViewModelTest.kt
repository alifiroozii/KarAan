package com.karvin.app

import com.karvin.app.domain.repository.NetworkAuthRepository
import com.karvin.app.core.session.SessionManager
import com.karvin.app.feature.auth.NetworkAuthViewModel
import io.mockk.mockk
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkAuthViewModelTest {
    @Test
    fun `short phone exposes validation error`() {
        val viewModel = NetworkAuthViewModel(mockk<NetworkAuthRepository>(), mockk<SessionManager>())
        viewModel.sendOtp("123")
        assertTrue(viewModel.state.value is com.karvin.app.feature.auth.NetworkAuthUiState.Error)
    }
}
