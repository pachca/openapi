package com.pachca.sdk

import kotlinx.serialization.KeepGeneratedSerializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.Transient
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

/**
 * Writes a request model as its generated serializer does: an unset field stays
 * out of the body. A field named in nullFields goes out as null, whatever value
 * it holds, and a name the model does not take as null fails before the request
 * is sent.
 */
internal open class NullFieldsSerializer<T>(
    private val generated: KSerializer<T>,
    private val model: String,
    private val keys: Map<String, String>,
    private val nullFields: (T) -> Set<String>,
) : KSerializer<T> {
    override val descriptor: SerialDescriptor get() = generated.descriptor

    override fun deserialize(decoder: Decoder): T = generated.deserialize(decoder)

    override fun serialize(encoder: Encoder, value: T) {
        val names = nullFields(value)
        val unknown = names.firstOrNull { it !in keys }
        if (unknown != null) throw SerializationException("$model: field \"$unknown\" cannot be sent as null")
        if (names.isEmpty() || encoder !is JsonEncoder) {
            generated.serialize(encoder, value)
            return
        }
        val body = encoder.json.encodeToJsonElement(generated, value).jsonObject.toMutableMap()
        for (name in names) body[keys.getValue(name)] = JsonNull
        encoder.encodeJsonElement(JsonObject(body))
    }
}

@Serializable
data class Item(
    val id: Int,
    val name: String,
    val description: String? = null,
    val priority: Int? = null,
)

@KeepGeneratedSerializer
@Serializable(with = ItemPatchRequestItemSerializer::class)
data class ItemPatchRequestItem(
    val name: String? = null,
    val description: String? = null,
    val priority: Int? = null,
    /** Fields to send as null: description. An unset field stays out of the body. */
    @Transient val nullFields: Set<String> = emptySet(),
)

internal object ItemPatchRequestItemSerializer : NullFieldsSerializer<ItemPatchRequestItem>(
    ItemPatchRequestItem.generatedSerializer(), "ItemPatchRequestItem", mapOf("description" to "description"), { it.nullFields },
)

@Serializable
data class ItemPatchRequest(
    val item: ItemPatchRequestItem,
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
data class ItemDataWrapper(val data: Item)
