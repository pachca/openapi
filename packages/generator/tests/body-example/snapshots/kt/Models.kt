package com.pachca.sdk

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject

@Serializable
enum class FileType(val value: String) {
    @SerialName("file") FILE("file"),
    @SerialName("image") IMAGE("image"),
    @SerialName("voice") VOICE("voice"),
}

@Serializable(with = ButtonSerializer::class)
sealed interface Button

// Button carries no discriminator field: members are tried in the order
// they match the payload keys (most recognised, then fewest unrecognised, then
// fewest declared), and the first one that decodes wins.
object ButtonSerializer : KSerializer<Button> {
    override val descriptor = buildClassSerialDescriptor("Button")

    private val shapes: List<Pair<Set<String>, (Json, JsonElement) -> Button>> = listOf(
        setOf("text", "url") to { json, element -> json.decodeFromJsonElement(UrlButton.serializer(), element) },
        setOf("text", "data") to { json, element -> json.decodeFromJsonElement(DataButton.serializer(), element) },
    )

    override fun serialize(encoder: Encoder, value: Button) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("ButtonSerializer only supports JSON")
        when (value) {
            is UrlButton -> jsonEncoder.encodeSerializableValue(UrlButton.serializer(), value)
            is DataButton -> jsonEncoder.encodeSerializableValue(DataButton.serializer(), value)
        }
    }

    override fun deserialize(decoder: Decoder): Button {
        val jsonDecoder = decoder as? JsonDecoder ?: error("ButtonSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val keys = element.jsonObject.keys
        // sortedWith is stable: a tie keeps the declared order.
        val ranked = shapes.sortedWith(
            compareByDescending<Pair<Set<String>, *>> { shape -> keys.count { it in shape.first } }
                .thenBy { shape -> keys.count { it !in shape.first } }
                .thenBy { shape -> shape.first.size },
        )
        var firstError: IllegalArgumentException? = null
        for (shape in ranked) {
            try {
                return shape.second(jsonDecoder.json, element)
            } catch (e: IllegalArgumentException) {
                // SerializationException is one: a wrong type or a missing required field.
                if (firstError == null) firstError = e
            }
        }
        throw firstError ?: kotlinx.serialization.SerializationException("No Button member matched the payload")
    }
}

@Serializable
data class UrlButton(
    val text: String,
    val url: String,
) : Button

@Serializable
data class DataButton(
    val text: String,
    val data: String,
) : Button

@Serializable
data class MessageFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: FileType,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("duration_ms") val durationMs: Int? = null,
    val waveform: String? = null,
)

@Serializable
data class MessageCreateRequestMessage(
    @SerialName("entity_id") val entityId: Int,
    val content: String? = null,
    val files: List<MessageFile>? = null,
    val buttons: List<List<Button>>? = null,
    @SerialName("display_name") val displayName: String? = null,
)

@Serializable
data class MessageCreateRequest(
    val message: MessageCreateRequestMessage,
    @SerialName("link_preview") val linkPreview: Boolean? = false,
)

@Serializable
data class MessageUpdateRequestMessage(
    val content: String? = null,
    val files: List<MessageFile>? = null,
)

@Serializable
data class MessageUpdateRequest(
    val message: MessageUpdateRequestMessage,
)

@Serializable
data class Message(
    val id: Int,
    val content: String,
)

@Serializable
data class ApiErrorItem(
    val key: String? = null,
    val value: String? = null,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>? = null,
    /** HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty. */
    @Transient val statusCode: Int? = null,
) : Exception()

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()
 {
    override val message: String get() = error
}

@Serializable
data class MessageDataWrapper(val data: Message)
