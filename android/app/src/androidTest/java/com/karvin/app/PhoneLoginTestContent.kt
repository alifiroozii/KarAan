package com.karvin.app

import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

@Composable
fun PhoneLoginTestContent() {
    var phone by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }
    OutlinedTextField(phone, { phone = it }, label = { Text("شماره موبایل") })
    Button(onClick = { error = phone.filter(Char::isDigit).length < 10 }) { Text("ادامه") }
    if (error) Text("شماره موبایل را کامل وارد کنید.")
}
