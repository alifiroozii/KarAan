package com.karvin.app.presentation.auth.employer_register

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500

@Composable
fun EmployerRegisterScreen(
    onNavigateBack: () -> Unit,
    onRegisterSuccess: (UserRole) -> Unit,
    viewModel: EmployerRegisterViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val scrollState = rememberScrollState()

    LaunchedEffect(state.registrationSuccessUser) {
        val user = state.registrationSuccessUser
        if (user != null) {
            onRegisterSuccess(UserRole.EMPLOYER)
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.employer_reg_title),
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(20.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                if (state.errorMessage != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Red500.copy(alpha = 0.1f))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = state.errorMessage ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = Red500,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                KarvinTextField(
                    value = state.fullName,
                    onValueChange = viewModel::onFullNameChange,
                    label = "نام و نام خانوادگی مدیر یا مسئول استخدام",
                    placeholder = "مثال: مهندس رضایی",
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = state.businessName,
                    onValueChange = viewModel::onBusinessNameChange,
                    label = stringResource(id = R.string.business_name_label),
                    placeholder = "مثال: شرکت ساختمانی سازه گستر / رستوران نارنجستان",
                    leadingIcon = { Icon(Icons.Default.Business, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = state.businessCategory,
                    onValueChange = viewModel::onBusinessCategoryChange,
                    label = stringResource(id = R.string.business_category_label),
                    placeholder = "مثال: پیمانکاری، لجستیک، خدمات، کافه رستوران",
                    leadingIcon = { Icon(Icons.Default.Category, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = state.city,
                    onValueChange = viewModel::onCityChange,
                    label = stringResource(id = R.string.city_label),
                    placeholder = "تهران، کرج...",
                    leadingIcon = { Icon(Icons.Default.LocationCity, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = state.address,
                    onValueChange = viewModel::onAddressChange,
                    label = stringResource(id = R.string.address_label),
                    placeholder = "آدرس دفتر مرکزی یا کارگاه"
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = state.contactInfo,
                    onValueChange = viewModel::onContactInfoChange,
                    label = stringResource(id = R.string.contact_info_label),
                    placeholder = "۰۲۱-۸۸۸۸۸۸۸۸",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(28.dp))
            }

            KarvinButton(
                text = stringResource(id = R.string.complete_registration),
                onClick = viewModel::registerEmployer,
                type = KarvinButtonType.PRIMARY,
                isLoading = state.isLoading
            )
        }
    }
}
