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

// EventDetailsUnion carries no discriminator field: members are tried in the order
// they match the payload keys (most recognised, then fewest unrecognised, then
// fewest declared), and the first one that decodes wins.
object EventDetailsUnionSerializer : KSerializer<EventDetailsUnion> {
    override val descriptor = buildClassSerialDescriptor("EventDetailsUnion")

    private val shapes: List<Pair<Set<String>, (Json, JsonElement) -> EventDetailsUnion>> = listOf(
        setOf<String>() to { json, element -> json.decodeFromJsonElement(DetailsEmpty.serializer(), element) },
        setOf("bot_id", "webhook_id", "scopes") to { json, element -> json.decodeFromJsonElement(DetailsBot.serializer(), element) },
        setOf("token_kind", "resource_owner_id", "current_scopes", "access_token_id", "bot_id", "webhook_id", "scopes") to { json, element -> json.decodeFromJsonElement(DetailsBotTokenUpdated.serializer(), element) },
        setOf("token_kind", "resource_owner_id", "scopes", "access_token_id", "bot_id", "webhook_id", "application_id", "device_name") to { json, element -> json.decodeFromJsonElement(DetailsToken.serializer(), element) },
    )

    override fun serialize(encoder: Encoder, value: EventDetailsUnion) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("EventDetailsUnionSerializer only supports JSON")
        when (value) {
            is DetailsEmpty -> jsonEncoder.encodeSerializableValue(DetailsEmpty.serializer(), value)
            is DetailsBot -> jsonEncoder.encodeSerializableValue(DetailsBot.serializer(), value)
            is DetailsBotTokenUpdated -> jsonEncoder.encodeSerializableValue(DetailsBotTokenUpdated.serializer(), value)
            is DetailsToken -> jsonEncoder.encodeSerializableValue(DetailsToken.serializer(), value)
        }
    }

    override fun deserialize(decoder: Decoder): EventDetailsUnion {
        val jsonDecoder = decoder as? JsonDecoder ?: error("EventDetailsUnionSerializer only supports JSON")
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
        throw firstError ?: kotlinx.serialization.SerializationException("No EventDetailsUnion member matched the payload")
    }
}

@Serializable
class DetailsEmpty : EventDetailsUnion

@Serializable
data class DetailsBot(
    @SerialName("bot_id") val botId: Int,
    @SerialName("webhook_id") val webhookId: Int? = null,
    val scopes: List<String>? = null,
) : EventDetailsUnion

@Serializable
data class DetailsBotTokenUpdated(
    @SerialName("token_kind") val tokenKind: String,
    @SerialName("resource_owner_id") val resourceOwnerId: Int,
    @SerialName("current_scopes") val currentScopes: List<String>? = null,
    @SerialName("access_token_id") val accessTokenId: Int,
    @SerialName("bot_id") val botId: Int? = null,
    @SerialName("webhook_id") val webhookId: Int? = null,
    val scopes: ScopesChange? = null,
) : EventDetailsUnion

@Serializable
data class DetailsToken(
    @SerialName("token_kind") val tokenKind: String,
    @SerialName("resource_owner_id") val resourceOwnerId: Int,
    val scopes: List<String>,
    @SerialName("access_token_id") val accessTokenId: Int,
    @SerialName("bot_id") val botId: Int? = null,
    @SerialName("webhook_id") val webhookId: Int? = null,
    @SerialName("application_id") val applicationId: Int? = null,
    @SerialName("device_name") val deviceName: String? = null,
) : EventDetailsUnion

@Serializable
data class ScopesChange(
    val previous: List<String>,
    val new: List<String>,
)

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
