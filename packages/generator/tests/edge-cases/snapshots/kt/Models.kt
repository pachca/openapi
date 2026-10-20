package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.json.JsonElement

@Serializable
enum class OAuthScope(val value: String) {
    @SerialName("chats:read") CHATS_READ("chats:read"),
    @SerialName("chats:write") CHATS_WRITE("chats:write"),
    @SerialName("users:read") USERS_READ("users:read"),
    @SerialName("users:write") USERS_WRITE("users:write"),
}

@Serializable
@JvmInline
value class EventType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val MESSAGE = EventType("message")
        val REACTION = EventType("reaction")

        /** Every value this SDK version lists */
        val entries: List<EventType> = listOf(MESSAGE, REACTION)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<EventType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("message" to "MESSAGE", "reaction" to "REACTION")

        fun valueOf(name: String): EventType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No EventType constant $name")
    }
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
data class Schedule(
    val days: List<Int>,
    val value: JsonElement? = null,
)

@Serializable
data class ListEventsResponse(
    val data: List<Event>,
)

@Serializable
data class EventDataWrapper(val data: Event)
