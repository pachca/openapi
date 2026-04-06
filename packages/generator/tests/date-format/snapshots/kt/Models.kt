package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ExportRequest(
    @SerialName("start_at") val startAt: String,
    @SerialName("end_at") val endAt: String,
    @SerialName("webhook_url") val webhookUrl: String,
)

@Serializable
data class Export(
    val id: Int,
    @SerialName("start_at") val startAt: String,
    @SerialName("end_at") val endAt: String,
    val status: String,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class Event(
    val id: Int,
    val type: String,
    @SerialName("occurred_at") val occurredAt: String,
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()

@Serializable
data class ListEventsResponse(
    val data: List<Event>,
)

@Serializable
data class ExportDataWrapper(val data: Export)
