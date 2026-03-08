package com.pachca.sdk

import kotlinx.serialization.Serializable

@Serializable
data class OrganizationSettingsNotificationsEmail(
    val enabled: Boolean,
    val frequency: String? = null,
)

@Serializable
data class OrganizationSettingsNotificationsPush(
    val enabled: Boolean? = null,
    val sound: String? = null,
)

@Serializable
data class OrganizationSettingsNotifications(
    val email: OrganizationSettingsNotificationsEmail,
    val push: OrganizationSettingsNotificationsPush? = null,
)

@Serializable
data class OrganizationSettings(
    val theme: String? = null,
    val notifications: OrganizationSettingsNotifications,
)

@Serializable
data class Organization(
    val id: Int,
    val name: String,
    val settings: OrganizationSettings,
)
