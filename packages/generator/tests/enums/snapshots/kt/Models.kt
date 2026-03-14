package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class SortOrder(val value: String) {
    @SerialName("asc") ASC("asc"),
    @SerialName("desc") DESC("desc"),
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
enum class ViewBlockHeaderType(val value: String) {
    /** Для заголовков всегда header */
    @SerialName("header") HEADER("header"),
}
