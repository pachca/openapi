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

/** Роль пользователя */
@Serializable
enum class UserRole(val value: String) {
    /** Администратор */
    @SerialName("admin") ADMIN("admin"),
    /** Сотрудник */
    @SerialName("user") USER("user"),
    /** Мультиадмин */
    @SerialName("multi_admin") MULTI_ADMIN("multi_admin"),
    /** Бот */
    @SerialName("bot") BOT("bot"),
}

@Serializable
data class User(
    val id: Int,
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val email: String,
    @SerialName("phone_number") val phoneNumber: String? = null,
    val role: UserRole,
    @SerialName("is_active") val isActive: Boolean,
    @SerialName("bot_id") val botId: Long? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    val birthday: String? = null,
    @SerialName("tag_ids") val tagIds: List<Int>,
    @SerialName("custom_properties") val customProperties: List<CustomProperty>? = null,
    val status: UserStatus? = null,
)

@Serializable
data class UserStatus(
    val emoji: String? = null,
    val title: String? = null,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("expires_at") val expiresAt: OffsetDateTime? = null,
)

@Serializable
data class CustomProperty(
    val id: Int,
    val name: String,
    @SerialName("data_type") val dataType: String,
    val value: String,
)

@Serializable
data class UserCreateRequestUser(
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val email: String,
    val role: UserRole? = null,
    @SerialName("is_active") val isActive: Boolean? = true,
)

@Serializable
data class UserCreateRequest(
    val user: UserCreateRequestUser,
)

@Serializable
data class UserUpdateRequestUser(
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @SerialName("phone_number") val phoneNumber: String? = null,
    val role: UserRole? = null,
)

@Serializable
data class UserUpdateRequest(
    val user: UserUpdateRequestUser,
)

@Serializable
data class MessageCreateRequestFile(
    val key: String,
    val name: String,
    @SerialName("file_type") val fileType: String,
    val size: Int,
)

@Serializable
data class MessageCreateRequestButton(
    val text: String,
    val url: String? = null,
    val data: String? = null,
)

@Serializable
data class MessageCreateRequestMessage(
    @SerialName("entity_id") val entityId: Int,
    val content: String,
    val files: List<MessageCreateRequestFile>? = null,
    val buttons: List<List<MessageCreateRequestButton>>? = null,
)

@Serializable
data class MessageCreateRequest(
    val message: MessageCreateRequestMessage,
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

@Serializable
data class PaginationMetaPaginate(
    @SerialName("next_page") val nextPage: String? = null,
)

@Serializable
data class PaginationMeta(
    val paginate: PaginationMetaPaginate? = null,
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
