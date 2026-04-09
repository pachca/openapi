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
enum class SortOrder(val value: String) {
    @SerialName("asc") ASC("asc"),
    @SerialName("desc") DESC("desc"),
}

@Serializable
enum class ChatAvailability(val value: String) {
    /** Чаты, где пользователь является участником */
    @SerialName("is_member") IS_MEMBER("is_member"),
    /** Все открытые чаты компании */
    @SerialName("public") PUBLIC("public"),
}

@Serializable
data class Chat(
    val id: Int,
    val name: String,
    @SerialName("is_channel") val isChannel: Boolean,
    @SerialName("is_public") val isPublic: Boolean,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    @SerialName("member_ids") val memberIds: List<Int>? = null,
)

@Serializable
data class ChatCreateRequestChat(
    val name: String,
    val channel: Boolean? = null,
    val public: Boolean? = null,
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
data class ApiErrorItem(
    val key: String? = null,
    val value: String? = null,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>? = null,
) : Exception()

@Serializable
data class OAuthError(
    val error: String? = null,
) : Exception()
 {
    override val message: String get() = error
}

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String? = null,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate? = null,
)

@Serializable
data class ListChatsResponse(
    val data: List<Chat>,
    val meta: PaginationMeta? = null,
)

@Serializable
data class ChatDataWrapper(val data: Chat)
