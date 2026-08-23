package com.karvin.app.data.repository

import com.karvin.app.data.local.dao.ShiftDao
import com.karvin.app.domain.model.AttendanceRecord
import com.karvin.app.domain.model.AttendanceVerificationMethod
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.repository.AttendanceRepository
import com.karvin.app.utils.PersianDateFormatter
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepositoryImpl @Inject constructor(
    private val shiftDao: ShiftDao
) : AttendanceRepository {

    private val attendanceRecordsFlow = MutableStateFlow(
        listOf(
            AttendanceRecord(
                id = "att_1",
                shiftId = "shift_1",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                employerId = "emp_101",
                jobTitle = "برق‌کاری تابلو و کابل‌کشی پروژه سعادت‌آباد",
                checkInTimestamp = System.currentTimeMillis() - 14400000,
                checkInLatitude = 35.7836,
                checkInLongitude = 51.3789,
                checkOutTimestamp = null,
                checkOutLatitude = null,
                checkOutLongitude = null,
                isLocationVerified = true,
                distanceToWorkplaceMeters = 28,
                verificationMethod = AttendanceVerificationMethod.GPS_GEOFENCE,
                isConfirmedByEmployer = true,
                totalHoursWorked = 4.0f
            ),
            AttendanceRecord(
                id = "att_2",
                shiftId = "shift_2",
                workerId = "worker_default",
                workerName = "محمد حسینی",
                employerId = "emp_104",
                jobTitle = "نصب و سیم‌کشی سیستم روشنایی سوله",
                checkInTimestamp = System.currentTimeMillis() - 172800000,
                checkInLatitude = 35.8021,
                checkInLongitude = 50.9123,
                checkOutTimestamp = System.currentTimeMillis() - 144000000,
                checkOutLatitude = 35.8021,
                checkOutLongitude = 50.9123,
                isLocationVerified = true,
                distanceToWorkplaceMeters = 15,
                verificationMethod = AttendanceVerificationMethod.GPS_GEOFENCE,
                isConfirmedByEmployer = true,
                totalHoursWorked = 8.0f
            )
        )
    )

    private val activeShiftFlow = MutableStateFlow<Shift?>(
        Shift(
            id = "shift_1",
            jobId = "job_1",
            jobTitle = "برق‌کاری تابلو و کابل‌کشی پروژه سعادت‌آباد",
            workerId = "worker_default",
            workerName = "محمد حسینی",
            employerId = "emp_101",
            employerName = "مهندس علیرضا رضایی",
            businessName = "شرکت ساختمانی سازه گستر البرز",
            date = "۱۴۰۳/۰۶/۰۵",
            startTime = "۰۸:۰۰",
            endTime = "۱۷:۰۰",
            location = "تهران، سعادت‌آباد، میدان کاج، خ سرو غربی",
            salaryToman = 1350000L,
            status = ShiftStatus.IN_PROGRESS,
            checkInTime = "۰۸:۰۵",
            checkOutTime = null
        )
    )

    override suspend fun startShiftWithGps(shiftId: String, workerLocation: LocationPoint): Resource<AttendanceRecord> {
        val now = System.currentTimeMillis()
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val checkInTimeString = timeFormat.format(Date(now))

        val record = AttendanceRecord(
            id = "att_${UUID.randomUUID().toString().take(8)}",
            shiftId = shiftId,
            workerId = "worker_default",
            workerName = "محمد حسینی",
            employerId = "emp_101",
            jobTitle = activeShiftFlow.value?.jobTitle ?: "شیفت کاری",
            checkInTimestamp = now,
            checkInLatitude = workerLocation.latitude,
            checkInLongitude = workerLocation.longitude,
            checkOutTimestamp = null,
            checkOutLatitude = null,
            checkOutLongitude = null,
            isLocationVerified = true,
            distanceToWorkplaceMeters = 25,
            verificationMethod = AttendanceVerificationMethod.GPS_GEOFENCE,
            isConfirmedByEmployer = true
        )

        activeShiftFlow.value = activeShiftFlow.value?.copy(
            status = ShiftStatus.IN_PROGRESS,
            checkInTime = checkInTimeString
        )

        val updated = attendanceRecordsFlow.value.toMutableList()
        updated.add(0, record)
        attendanceRecordsFlow.value = updated

        return Resource.Success(record)
    }

    override suspend fun endShiftWithGps(shiftId: String, workerLocation: LocationPoint): Resource<AttendanceRecord> {
        val now = System.currentTimeMillis()
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val checkOutTimeString = timeFormat.format(Date(now))

        val currentRecords = attendanceRecordsFlow.value.toMutableList()
        val index = currentRecords.indexOfFirst { it.shiftId == shiftId }

        val updatedRecord = if (index != -1) {
            val existing = currentRecords[index]
            val durationHours = if (existing.checkInTimestamp != null) {
                ((now - existing.checkInTimestamp) / (1000f * 3600f)).coerceAtLeast(1.0f)
            } else 8.0f

            existing.copy(
                checkOutTimestamp = now,
                checkOutLatitude = workerLocation.latitude,
                checkOutLongitude = workerLocation.longitude,
                totalHoursWorked = durationHours
            )
        } else {
            AttendanceRecord(
                id = "att_${UUID.randomUUID().toString().take(8)}",
                shiftId = shiftId,
                workerId = "worker_default",
                workerName = "محمد حسینی",
                employerId = "emp_101",
                jobTitle = activeShiftFlow.value?.jobTitle ?: "شیفت کاری",
                checkInTimestamp = now - 28800000,
                checkInLatitude = workerLocation.latitude,
                checkInLongitude = workerLocation.longitude,
                checkOutTimestamp = now,
                checkOutLatitude = workerLocation.latitude,
                checkOutLongitude = workerLocation.longitude,
                totalHoursWorked = 8.0f
            )
        }

        if (index != -1) {
            currentRecords[index] = updatedRecord
        } else {
            currentRecords.add(0, updatedRecord)
        }
        attendanceRecordsFlow.value = currentRecords

        activeShiftFlow.value = activeShiftFlow.value?.copy(
            status = ShiftStatus.COMPLETED,
            checkOutTime = checkOutTimeString
        )

        return Resource.Success(updatedRecord)
    }

    override suspend fun confirmAttendanceByEmployer(shiftId: String, isConfirmed: Boolean): Resource<Boolean> {
        val currentRecords = attendanceRecordsFlow.value.toMutableList()
        val index = currentRecords.indexOfFirst { it.shiftId == shiftId }
        if (index != -1) {
            currentRecords[index] = currentRecords[index].copy(isConfirmedByEmployer = isConfirmed)
            attendanceRecordsFlow.value = currentRecords
        }
        return Resource.Success(true)
    }

    override fun getAttendanceHistory(userId: String): Flow<List<AttendanceRecord>> = attendanceRecordsFlow

    override fun getActiveShift(workerId: String): Flow<Shift?> = activeShiftFlow
}
