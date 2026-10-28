package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
enum class SortOrder(val value: String) {
    @SerialName("asc") ASC("asc"),
    @SerialName("desc") DESC("desc"),
}

@Serializable
enum class MemberKind(val value: String) {
    @SerialName("regular") REGULAR("regular"),
    @SerialName("guest") GUEST("guest"),
    @SerialName("value") VALUE("value"),
}

/** Member role */
@Serializable
@JvmInline
value class MemberRole(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Administrator */
        val ADMIN = MemberRole("admin")
        /** Member */
        val USER = MemberRole("user")

        /** Every value this SDK version lists */
        val entries: List<MemberRole> = listOf(ADMIN, USER)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<MemberRole> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("admin" to "ADMIN", "user" to "USER")

        fun valueOf(name: String): MemberRole =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No MemberRole constant $name")
    }
}

@Serializable
@JvmInline
value class Region(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val EU = Region("eu")
        val US = Region("us")

        /** Every value this SDK version lists */
        val entries: List<Region> = listOf(EU, US)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<Region> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("eu" to "EU", "us" to "US")

        fun valueOf(name: String): Region =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No Region constant $name")
    }
}

@Serializable
@JvmInline
value class MemberStatus(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val ACTIVE = MemberStatus("active")
        val SUSPENDED = MemberStatus("suspended")
        val UNKNOWN = MemberStatus("unknown")

        /** Every value this SDK version lists */
        val entries: List<MemberStatus> = listOf(ACTIVE, SUSPENDED, UNKNOWN)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<MemberStatus> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("active" to "ACTIVE", "suspended" to "SUSPENDED", "unknown" to "UNKNOWN")

        fun valueOf(name: String): MemberStatus =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No MemberStatus constant $name")
    }
}

@Serializable
@JvmInline
value class ErrorCode(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val BLANK = ErrorCode("blank")
        val TAKEN = ErrorCode("taken")

        /** Every value this SDK version lists */
        val entries: List<ErrorCode> = listOf(BLANK, TAKEN)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<ErrorCode> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("blank" to "BLANK", "taken" to "TAKEN")

        fun valueOf(name: String): ErrorCode =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No ErrorCode constant $name")
    }
}

/** OAuth error code */
@Serializable
@JvmInline
value class OAuthErrorCode(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** The token is missing or revoked */
        val INVALID_TOKEN = OAuthErrorCode("invalid_token")
        /** The token lacks the scope */
        val INSUFFICIENT_SCOPE = OAuthErrorCode("insufficient_scope")

        /** Every value this SDK version lists */
        val entries: List<OAuthErrorCode> = listOf(INVALID_TOKEN, INSUFFICIENT_SCOPE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<OAuthErrorCode> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("invalid_token" to "INVALID_TOKEN", "insufficient_scope" to "INSUFFICIENT_SCOPE")

        fun valueOf(name: String): OAuthErrorCode =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No OAuthErrorCode constant $name")
    }
}

@Serializable
@JvmInline
value class PayloadKind(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val CREATED = PayloadKind("created")
        val VALUE = PayloadKind("value")

        /** Every value this SDK version lists */
        val entries: List<PayloadKind> = listOf(CREATED, VALUE)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<PayloadKind> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("created" to "CREATED", "value" to "VALUE")

        fun valueOf(name: String): PayloadKind =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No PayloadKind constant $name")
    }
}

@Serializable
data class Member(
    val id: Int,
    val role: MemberRole,
    val status: MemberStatus,
    @SerialName("previous_statuses") val previousStatuses: List<MemberStatus>? = null,
)

@Serializable
data class MemberUpdateRequest(
    val role: MemberRole? = null,
    val kind: MemberKind? = null,
)

@Serializable
data class MemberEventPayload(
    val kind: PayloadKind,
)

@Serializable
data class ApiErrorItem(
    val key: String,
    val message: String,
    val code: ErrorCode,
)

@Serializable
data class ApiError(
    val errors: List<ApiErrorItem>,
    /** HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty. */
    @Transient val statusCode: Int? = null,
) : Exception()

@Serializable
data class OAuthError(
    val error: OAuthErrorCode,
    @SerialName("error_description") val errorDescription: String,
) : Exception()
 {
    override val message: String get() = error.value
}

@Serializable
data class ListMembersResponse(
    val data: List<Member>,
)

@Serializable
data class MemberDataWrapper(val data: Member)
