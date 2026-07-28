package com.pachca.sdk

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject

@Serializable(with = EventDetailsUnionSerializer::class)
sealed interface EventDetailsUnion

// EventDetailsUnion carries no discriminator field: the member is chosen by which one
// best matches the payload keys (most recognised, then fewest unrecognised,
// then fewest declared).
object EventDetailsUnionSerializer : KSerializer<EventDetailsUnion> {
    override val descriptor = buildClassSerialDescriptor("EventDetailsUnion")

    private val shapes: List<Pair<Set<String>, (Json, JsonElement) -> EventDetailsUnion>> = listOf(
        setOf<String>() to { json, element -> json.decodeFromJsonElement(DetailsEmpty.serializer(), element) },
        setOf("chat_id") to { json, element -> json.decodeFromJsonElement(DetailsChat.serializer(), element) },
        setOf("chat_id", "duration", "recording_size") to { json, element -> json.decodeFromJsonElement(DetailsCall.serializer(), element) },
        setOf("old_name", "new_name") to { json, element -> json.decodeFromJsonElement(DetailsRename.serializer(), element) },
    )

    override fun serialize(encoder: Encoder, value: EventDetailsUnion) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("EventDetailsUnionSerializer only supports JSON")
        when (value) {
            is DetailsEmpty -> jsonEncoder.encodeSerializableValue(DetailsEmpty.serializer(), value)
            is DetailsChat -> jsonEncoder.encodeSerializableValue(DetailsChat.serializer(), value)
            is DetailsCall -> jsonEncoder.encodeSerializableValue(DetailsCall.serializer(), value)
            is DetailsRename -> jsonEncoder.encodeSerializableValue(DetailsRename.serializer(), value)
        }
    }

    override fun deserialize(decoder: Decoder): EventDetailsUnion {
        val jsonDecoder = decoder as? JsonDecoder ?: error("EventDetailsUnionSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val keys = element.jsonObject.keys
        var best: Pair<Set<String>, (Json, JsonElement) -> EventDetailsUnion>? = null
        var bestMatched = 0
        var bestUnknown = 0
        var bestDeclared = 0
        for (shape in shapes) {
            val matched = keys.count { it in shape.first }
            val unknown = keys.size - matched
            val declared = shape.first.size
            val better = best == null ||
                matched > bestMatched ||
                (matched == bestMatched && unknown < bestUnknown) ||
                (matched == bestMatched && unknown == bestUnknown && declared < bestDeclared)
            if (better) {
                best = shape
                bestMatched = matched
                bestUnknown = unknown
                bestDeclared = declared
            }
        }
        val chosen = best ?: error("No EventDetailsUnion member matched the payload")
        return chosen.second(jsonDecoder.json, element)
    }
}

@Serializable
class DetailsEmpty : EventDetailsUnion

@Serializable
data class DetailsChat(
    @SerialName("chat_id") val chatId: Int,
) : EventDetailsUnion

@Serializable
data class DetailsCall(
    @SerialName("chat_id") val chatId: Int,
    val duration: Int,
    @SerialName("recording_size") val recordingSize: Long? = null,
) : EventDetailsUnion

@Serializable
data class DetailsRename(
    @SerialName("old_name") val oldName: String,
    @SerialName("new_name") val newName: String,
) : EventDetailsUnion

@Serializable
data class Event(
    val id: Int,
    @SerialName("event_key") val eventKey: Any,
    val details: EventDetailsUnion,
)

@Serializable
data class GetEventsResponse(
    val data: List<Event>,
)
