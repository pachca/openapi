package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class FileUploadRequest(
    val key: String,
    @SerialName("content-disposition") val contentDisposition: String? = null,
    val acl: String? = null,
    val policy: String? = null,
    @SerialName("x-amz-credential") val xAmzCredential: String? = null,
    @SerialName("x-amz-algorithm") val xAmzAlgorithm: String? = null,
    @SerialName("x-amz-date") val xAmzDate: String? = null,
    @SerialName("x-amz-signature") val xAmzSignature: String? = null,
    @Transient val file: ByteArray = ByteArray(0),
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()
