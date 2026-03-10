from __future__ import annotations

from dataclasses import dataclass

@dataclass
class OrganizationSettingsNotificationsEmail:
    enabled: bool
    frequency: str | None = None


@dataclass
class OrganizationSettingsNotificationsPush:
    enabled: bool | None = None
    sound: str | None = None


@dataclass
class OrganizationSettingsNotifications:
    email: OrganizationSettingsNotificationsEmail
    push: OrganizationSettingsNotificationsPush | None = None


@dataclass
class OrganizationSettings:
    notifications: OrganizationSettingsNotifications
    theme: str | None = None


@dataclass
class Organization:
    id: int
    name: str
    settings: OrganizationSettings
