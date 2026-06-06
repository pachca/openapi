package com.pachca.sdk

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object OffsetDateTimeSerializer : KSerializer<OffsetDateTime> {
    override val descriptor = PrimitiveSerialDescriptor("OffsetDateTime", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: OffsetDateTime) = encoder.encodeString(value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
    override fun deserialize(decoder: Decoder): OffsetDateTime = OffsetDateTime.parse(decoder.decodeString(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
}

@Serializable
sealed interface WebhookPayloadUnion {
    val type: String
}

@Serializable
@SerialName("message_new")
data class MessageWebhookPayload(
    override val type: String = "message_new",
    @SerialName("message_id") val messageId: Int,
) : WebhookPayloadUnion

@Serializable
@SerialName("reaction_added")
data class ReactionWebhookPayload(
    override val type: String = "reaction_added",
    val reaction: String,
) : WebhookPayloadUnion

@Serializable
data class WebhookEvent(
    val id: String,
    @SerialName("event_type") val eventType: String,
    val payload: WebhookPayloadUnion,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
)

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
    @SerialName("has_next") val hasNext: Boolean? = null,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate,
)

@Serializable
data class GetWebhookEventsResponse(
    val data: List<WebhookEvent>,
    val meta: PaginationMeta,
)
