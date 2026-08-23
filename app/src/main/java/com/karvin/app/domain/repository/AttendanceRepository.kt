package com.karvin.app.domain.repository

import com.karvin.app.domain.model.AttendanceRecord
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.Shift
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface AttendanceRepository {
    suspend fun startShiftWithGps(shiftId: String, workerLocation: LocationPoint): Resource<AttendanceRecord>
    suspend fun endShiftWithGps(shiftId: String, workerLocation: LocationPoint): Resource<AttendanceRecord>
    suspend fun confirmAttendanceByEmployer(shiftId: String, isConfirmed: Boolean): Resource<Boolean>
    fun getAttendanceHistory(userId: String): Flow<List<AttendanceRecord>>
    fun getActiveShift(workerId: String): Flow<Shift?>
}
