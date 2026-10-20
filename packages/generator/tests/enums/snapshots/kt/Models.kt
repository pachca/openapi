package com.pachca.sdk

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class SortOrder(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        val ASC = SortOrder("asc")
        val DESC = SortOrder("desc")

        /** Every value this SDK version lists */
        val entries: List<SortOrder> = listOf(ASC, DESC)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<SortOrder> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("asc" to "ASC", "desc" to "DESC")

        fun valueOf(name: String): SortOrder =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No SortOrder constant $name")
    }
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
@JvmInline
value class ViewBlockHeaderType(val value: String) {
    /** Whether this SDK version lists the value */
    val isKnown: Boolean get() = value in knownNames
    /** Constant name of a listed value, the raw value otherwise */
    val name: String get() = knownNames[value] ?: value
    override fun toString(): String = value

    companion object {
        /** Для заголовков всегда header */
        val HEADER = ViewBlockHeaderType("header")

        /** Every value this SDK version lists */
        val entries: List<ViewBlockHeaderType> = listOf(HEADER)

        /** The same values as an array, like `values()` of an enum class */
        fun values(): Array<ViewBlockHeaderType> = entries.toTypedArray()

        private val knownNames: Map<String, String> = mapOf("header" to "HEADER")

        fun valueOf(name: String): ViewBlockHeaderType =
            entries.firstOrNull { it.name == name } ?: throw IllegalArgumentException("No ViewBlockHeaderType constant $name")
    }
}
