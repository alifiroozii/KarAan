package com.karvin.app.feature.media

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.karvin.app.core.common.ApiResult
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

interface MediaApi {
    @Multipart @POST("media/upload") suspend fun upload(@Part file: MultipartBody.Part): MediaUploadResponse
}
data class MediaUploadResponse(val url: String)
interface MediaRepository { suspend fun uploadImage(uri: Uri): ApiResult<String> }

class MediaRepositoryImpl @Inject constructor(@ApplicationContext private val context: Context, private val api: MediaApi) : MediaRepository {
    override suspend fun uploadImage(uri: Uri): ApiResult<String> = runCatching {
        val file = File(context.cacheDir, "upload_${System.currentTimeMillis()}.jpg")
        context.contentResolver.openInputStream(uri).use { input -> requireNotNull(input); FileOutputStream(file).use { output -> BitmapFactory.decodeStream(input).compress(Bitmap.CompressFormat.JPEG, 80, output) } }
        val body = file.asRequestBody("image/jpeg".toMediaType())
        ApiResult.Success(api.upload(MultipartBody.Part.createFormData("file", file.name, body)).url)
    }.getOrElse { ApiResult.Error(it.message ?: "آپلود تصویر ناموفق بود", it) }
}
