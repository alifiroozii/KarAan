package com.karvin.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import org.junit.Rule
import org.junit.Test

class AuthScreenTest {
    @get:Rule val composeRule = createComposeRule()

    @Test
    fun invalidPhoneShowsValidationMessage() {
        composeRule.setContent { PhoneLoginTestContent() }
        composeRule.onNodeWithText("شماره موبایل").performTextInput("123")
        composeRule.onNodeWithText("ادامه").performClick()
        composeRule.onNodeWithText("شماره موبایل را کامل وارد کنید.").assertIsDisplayed()
    }
}
