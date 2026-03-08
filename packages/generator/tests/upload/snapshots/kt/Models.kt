package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class FileUploadRequest(
    @SerialName("content-disposition") val contentDisposition: String,
    val acl: String,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    @Transient val file: ByteArray = ByteArray(0),
)

@Serializable
data class UploadParams(
    @SerialName("Content-Disposition") val contentDisposition: String,
    val acl: String,
    val policy: String,
    @SerialName("x-amz-credential") val xAmzCredential: String,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String,
    @SerialName("x-amz-date") val xAmzDate: String,
    @SerialName("x-amz-signature") val xAmzSignature: String,
    val key: String,
    @SerialName("direct_url") val directUrl: String,
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()

@Serializable
data class UploadParamsDataWrapper(val data: UploadParams)
