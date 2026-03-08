package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
enum class OAuthScope(val value: String) {
    @SerialName("chats:read") CHATS_READ("chats:read"),
    @SerialName("chats:write") CHATS_WRITE("chats:write"),
    @SerialName("users:read") USERS_READ("users:read"),
    @SerialName("users:write") USERS_WRITE("users:write"),
}

@Serializable
enum class EventType(val value: String) {
    @SerialName("message") MESSAGE("message"),
    @SerialName("reaction") REACTION("reaction"),
}

@Serializable
sealed interface NotificationUnion {
    val kind: String
}

@Serializable
@SerialName("message")
data class MessageNotification(
    override val kind: String = "message",
    val text: String,
) : NotificationUnion

@Serializable
@SerialName("message")
data class ReactionNotification(
    override val kind: String = "message",
    val emoji: String,
) : NotificationUnion

@Serializable
class EventFilter

@Serializable
data class Event(
    val id: Int,
    val type: EventType,
)

@Serializable
data class PublishEventRequest(
    val scope: OAuthScope,
)

@Serializable
data class UploadRequest(
    @SerialName("Content-Disposition") val contentDisposition: String,
    @Transient val file: ByteArray = ByteArray(0),
)

@Serializable
data class Notification(
    val kind: String,
)

@Serializable
data class ListEventsResponse(
    val data: List<Event>,
)

@Serializable
data class EventDataWrapper(val data: Event)
