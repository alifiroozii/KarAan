package com.karvin.app.presentation.employer.invitations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.R
import com.karvin.app.domain.model.JobInvitation
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.utils.PriceFormatter
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SendInvitationDialog(
    worker: WorkerProfile,
    onDismiss: () -> Unit,
    onSendInvitation: (JobInvitation) -> Unit
) {
    var jobTitle by remember { mutableStateOf("برق‌کار صنعتی و تابلو برق پروژه سعادت‌آباد") }
    var salaryToman by remember { mutableStateOf("1350000") }
    var date by remember { mutableStateOf("۱۴۰۳/۰۶/۰۸") }
    var time by remember { mutableStateOf("۰۸:۳۰ الی ۱۷:۰۰") }
    var location by remember { mutableStateOf("تهران، سعادت‌آباد، میدان کاج") }
    var message by remember { mutableStateOf("سلام وقت بخیر، مایل به همکاری در این پروژه با شرایط ذکر شده هستیم.") }

    BasicAlertDialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "ارسال دعوت‌نامه کاری مستقیم",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "برای: ${worker.fullName} (${worker.primarySkill})",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Navy900,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = jobTitle,
                    onValueChange = { jobTitle = it },
                    label = "عنوان فرصت شغلی"
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    KarvinTextField(
                        value = salaryToman,
                        onValueChange = { salaryToman = it },
                        label = "دستمزد (تومان)",
                        modifier = Modifier.weight(1f)
                    )
                    KarvinTextField(
                        value = date,
                        onValueChange = { date = it },
                        label = "تاریخ",
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                KarvinTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = "آدرس محل کارگاه"
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("پیام برای کارگر") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KarvinButton(
                        text = stringResource(id = R.string.cancel),
                        onClick = onDismiss,
                        type = KarvinButtonType.OUTLINED,
                        modifier = Modifier.weight(1f),
                        height = 42.dp,
                        shapeRadius = 10.dp
                    )
                    KarvinButton(
                        text = "ارسال دعوت‌نامه",
                        onClick = {
                            val inv = JobInvitation(
                                id = "inv_${UUID.randomUUID().toString().take(8)}",
                                employerId = "emp_101",
                                employerName = "مهندس علیرضا رضایی",
                                businessName = "شرکت ساختمانی سازه گستر البرز",
                                employerRating = 4.9f,
                                workerId = worker.userId,
                                workerName = worker.fullName,
                                jobId = "job_direct_${UUID.randomUUID().toString().take(6)}",
                                jobTitle = jobTitle,
                                jobSalaryToman = salaryToman.toLongOrNull() ?: 1350000L,
                                jobDate = date,
                                jobTime = time,
                                location = location,
                                message = message
                            )
                            onSendInvitation(inv)
                        },
                        type = KarvinButtonType.PRIMARY,
                        modifier = Modifier.weight(1.3f),
                        height = 42.dp,
                        shapeRadius = 10.dp
                    )
                }
            }
        }
    }
}
