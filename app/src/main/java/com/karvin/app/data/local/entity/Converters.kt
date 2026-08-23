package com.karvin.app.data.local.entity

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.UserRole

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromStringList(value: List<String>?): String {
        return gson.toJson(value ?: emptyList<String>())
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        val listType = object : TypeToken<List<String>>() {}.type
        return try {
            gson.fromJson(value, listType) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    @TypeConverter
    fun fromSkillList(value: List<Skill>?): String {
        return gson.toJson(value ?: emptyList<Skill>())
    }

    @TypeConverter
    fun toSkillList(value: String): List<Skill> {
        val listType = object : TypeToken<List<Skill>>() {}.type
        return try {
            gson.fromJson(value, listType) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    @TypeConverter
    fun fromCategoryList(value: List<JobCategory>?): String {
        return gson.toJson(value ?: emptyList<JobCategory>())
    }

    @TypeConverter
    fun toCategoryList(value: String): List<JobCategory> {
        val listType = object : TypeToken<List<JobCategory>>() {}.type
        return try {
            gson.fromJson(value, listType) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    @TypeConverter
    fun fromUserRole(role: UserRole): String = role.name

    @TypeConverter
    fun toUserRole(value: String): UserRole = try {
        UserRole.valueOf(value)
    } catch (e: Exception) {
        UserRole.NONE
    }

    @TypeConverter
    fun fromGender(gender: Gender): String = gender.name

    @TypeConverter
    fun toGender(value: String): Gender = try {
        Gender.valueOf(value)
    } catch (e: Exception) {
        Gender.MALE
    }

    @TypeConverter
    fun fromJobStatus(status: JobStatus): String = status.name

    @TypeConverter
    fun toJobStatus(value: String): JobStatus = try {
        JobStatus.valueOf(value)
    } catch (e: Exception) {
        JobStatus.OPEN
    }

    @TypeConverter
    fun fromApplicationStatus(status: ApplicationStatus): String = status.name

    @TypeConverter
    fun toApplicationStatus(value: String): ApplicationStatus = try {
        ApplicationStatus.valueOf(value)
    } catch (e: Exception) {
        ApplicationStatus.PENDING
    }

    @TypeConverter
    fun fromShiftStatus(status: ShiftStatus): String = status.name

    @TypeConverter
    fun toShiftStatus(value: String): ShiftStatus = try {
        ShiftStatus.valueOf(value)
    } catch (e: Exception) {
        ShiftStatus.UPCOMING
    }

    @TypeConverter
    fun fromNotificationType(type: NotificationType): String = type.name

    @TypeConverter
    fun toNotificationType(value: String): NotificationType = try {
        NotificationType.valueOf(value)
    } catch (e: Exception) {
        NotificationType.SYSTEM_ALERT
    }
}
