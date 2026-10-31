package com.pachca.sdk

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement
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
        setOf("bot_id", "actor_id", "webhook_id", "scopes") to { json, element -> json.decodeFromJsonElement(DetailsBot.serializer(), element) },
        setOf("bot_id", "scopes") to { json, element -> json.decodeFromJsonElement(DetailsBotScopes.serializer(), element) },
        setOf("token_kind", "resource_owner_id", "access_token_id", "bot_id", "webhook_id", "scopes") to { json, element -> json.decodeFromJsonElement(DetailsBotTokenUpdated.serializer(), element) },
        setOf("token_kind", "resource_owner_id", "scopes", "access_token_id") to { json, element -> json.decodeFromJsonElement(DetailsToken.serializer(), element) },
    )

    override fun serialize(encoder: Encoder, value: EventDetailsUnion) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("EventDetailsUnionSerializer only supports JSON")
        when (value) {
            is DetailsEmpty -> jsonEncoder.encodeSerializableValue(DetailsEmpty.serializer(), value)
            is DetailsBot -> jsonEncoder.encodeSerializableValue(DetailsBot.serializer(), value)
            is DetailsBotScopes -> jsonEncoder.encodeSerializableValue(DetailsBotScopes.serializer(), value)
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
    @SerialName("actor_id") val actorId: Int? = null,
    @SerialName("webhook_id") val webhookId: Int? = null,
    val scopes: DetailsBotScopesValue? = null,
) : EventDetailsUnion

@Serializable
data class DetailsBotScopes(
    @SerialName("bot_id") val botId: Int,
    val scopes: List<String>,
) : EventDetailsUnion

@Serializable
data class DetailsBotTokenUpdated(
    @SerialName("token_kind") val tokenKind: String,
    @SerialName("resource_owner_id") val resourceOwnerId: Int,
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
) : EventDetailsUnion

/**
 * Права токена у bot_token_created, изменение прав у bot_token_updated в старых записях.
 */
@Serializable(with = DetailsBotScopesValueSerializer::class)
sealed interface DetailsBotScopesValue {
    data class StringList(val value: kotlin.collections.List<kotlin.String>) : DetailsBotScopesValue
    data class ScopesChange(val value: com.pachca.sdk.ScopesChange) : DetailsBotScopesValue
}

object DetailsBotScopesValueSerializer : KSerializer<DetailsBotScopesValue> {
    override val descriptor = buildClassSerialDescriptor("DetailsBotScopesValue")

    override fun serialize(encoder: Encoder, value: DetailsBotScopesValue) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("DetailsBotScopesValueSerializer only supports JSON")
        val element = when (value) {
            is DetailsBotScopesValue.StringList -> jsonEncoder.json.encodeToJsonElement(value.value)
            is DetailsBotScopesValue.ScopesChange -> jsonEncoder.json.encodeToJsonElement(value.value)
        }
        jsonEncoder.encodeJsonElement(element)
    }

    override fun deserialize(decoder: Decoder): DetailsBotScopesValue {
        val jsonDecoder = decoder as? JsonDecoder ?: error("DetailsBotScopesValueSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val json = jsonDecoder.json
        return when {
            element is JsonArray -> DetailsBotScopesValue.StringList(json.decodeFromJsonElement<kotlin.collections.List<kotlin.String>>(element))
            element is JsonObject -> DetailsBotScopesValue.ScopesChange(json.decodeFromJsonElement<com.pachca.sdk.ScopesChange>(element))
            else -> throw SerializationException("DetailsBotScopesValue takes StringList or ScopesChange, got $element")
        }
    }
}

/**
 * Автор события. Строка у системных событий.
 */
@Serializable(with = EventActorSerializer::class)
sealed interface EventActor {
    data class String(val value: kotlin.String) : EventActor
    data class Actor(val value: com.pachca.sdk.Actor) : EventActor
}

object EventActorSerializer : KSerializer<EventActor> {
    override val descriptor = buildClassSerialDescriptor("EventActor")

    override fun serialize(encoder: Encoder, value: EventActor) {
        val jsonEncoder = encoder as? JsonEncoder ?: error("EventActorSerializer only supports JSON")
        val element = when (value) {
            is EventActor.String -> jsonEncoder.json.encodeToJsonElement(value.value)
            is EventActor.Actor -> jsonEncoder.json.encodeToJsonElement(value.value)
        }
        jsonEncoder.encodeJsonElement(element)
    }

    override fun deserialize(decoder: Decoder): EventActor {
        val jsonDecoder = decoder as? JsonDecoder ?: error("EventActorSerializer only supports JSON")
        val element = jsonDecoder.decodeJsonElement()
        val json = jsonDecoder.json
        return when {
            element is JsonObject -> EventActor.Actor(json.decodeFromJsonElement<com.pachca.sdk.Actor>(element))
            element is JsonPrimitive && element.isString -> EventActor.String(json.decodeFromJsonElement<kotlin.String>(element))
            else -> throw SerializationException("EventActor takes String or Actor, got $element")
        }
    }
}

@Serializable
data class ScopesChange(
    val previous: List<String>,
    val new: List<String>,
)

@Serializable
data class Actor(
    val id: Int,
    val name: String? = null,
)

@Serializable
data class Event(
    val id: Int,
    @SerialName("event_key") val eventKey: String,
    val actor: EventActor? = null,
    val details: EventDetailsUnion,
)

@Serializable
data class GetEventsResponse(
    val data: List<Event>,
)
