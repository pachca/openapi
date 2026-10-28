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

/** Роль пользователя */
@Serializable
@JvmInline
value class UserRole(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Администратор */
        val ADMIN = UserRole("admin")
        /** Сотрудник */
        val USER = UserRole("user")
        /** Мультиадмин */
        val MULTI_ADMIN = UserRole("multi_admin")
        /** Бот */
        val BOT = UserRole("bot")

        /** Every value this SDK version lists */
        val entries: List<UserRole> = listOf(ADMIN, USER, MULTI_ADMIN, BOT)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<UserRole> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("admin" to "ADMIN", "user" to "USER", "multi_admin" to "MULTI_ADMIN", "bot" to "BOT")

        fun valueOf(name: String): UserRole =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No UserRole constant $name")
    }
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
