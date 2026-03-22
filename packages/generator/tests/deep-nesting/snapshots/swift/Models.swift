import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct OrganizationSettingsNotificationsEmail: Codable {
    public let enabled: Bool
    public let frequency: String?

    public init(enabled: Bool, frequency: String? = nil) {
        self.enabled = enabled
        self.frequency = frequency
    }
}

public struct OrganizationSettingsNotificationsPush: Codable {
    public let enabled: Bool?
    public let sound: String?

    public init(enabled: Bool? = nil, sound: String? = nil) {
        self.enabled = enabled
        self.sound = sound
    }
}

public struct OrganizationSettingsNotifications: Codable {
    public let email: OrganizationSettingsNotificationsEmail
    public let push: OrganizationSettingsNotificationsPush?

    public init(email: OrganizationSettingsNotificationsEmail, push: OrganizationSettingsNotificationsPush? = nil) {
        self.email = email
        self.push = push
    }
}

public struct OrganizationSettings: Codable {
    public let theme: String?
    public let notifications: OrganizationSettingsNotifications

    public init(theme: String? = nil, notifications: OrganizationSettingsNotifications) {
        self.theme = theme
        self.notifications = notifications
    }
}

public struct Organization: Codable {
    public let id: Int
    public let name: String
    public let settings: OrganizationSettings

    public init(id: Int, name: String, settings: OrganizationSettings) {
        self.id = id
        self.name = name
        self.settings = settings
    }
}
