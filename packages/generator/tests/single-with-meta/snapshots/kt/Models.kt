package com.pachca.sdk

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
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
data class ChatCreateRequestChat(
    val name: String,
    @SerialName("member_ids") val memberIds: List<Int>? = null,
)

@Serializable
data class ChatCreateRequest(
    val chat: ChatCreateRequestChat,
)

@Serializable
data class ChatUpdateRequestChat(
    val name: String? = null,
    val public: Boolean? = null,
)

@Serializable
data class ChatUpdateRequest(
    val chat: ChatUpdateRequestChat,
)

@Serializable
data class ChatUpdateMeta(
    @SerialName("changed_fields") val changedFields: List<String>,
)

@Serializable
data class Chat(
    val id: Int,
    val name: String,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
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
data class CreateChatResponseMeta(
    @SerialName("not_found_member_ids") val notFoundMemberIds: List<Int>,
)

@Serializable
data class CreateChatResponse(
    val data: Chat,
    val meta: CreateChatResponseMeta,
)

@Serializable
data class UpdateChatResponse(
    val data: Chat,
    val meta: ChatUpdateMeta? = null,
)

@Serializable
data class ChatDataWrapper(val data: Chat)
