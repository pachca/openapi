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
enum class SearchSort(val value: String) {
    /** По релевантности */
    @SerialName("relevance") RELEVANCE("relevance"),
    /** По дате */
    @SerialName("date") DATE("date"),
}

@Serializable
data class MessageSearchResult(
    val id: Int,
    @SerialName("chat_id") val chatId: Int,
    @SerialName("user_id") val userId: Int,
    val content: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
)

@Serializable
data class SearchPaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String,
)

@Serializable
data class SearchPaginationMeta(
    val total: Int,
    val paginate: SearchPaginationMetaPaginate,
)

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()
 {
    override val message: String get() = error
}

@Serializable
data class SearchMessagesResponse(
    val data: List<MessageSearchResult>,
    val meta: SearchPaginationMeta,
)
