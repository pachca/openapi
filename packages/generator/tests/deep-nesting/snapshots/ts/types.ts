export interface OrganizationSettingsNotificationsEmail {
  enabled: boolean;
  frequency?: string;
}

export interface OrganizationSettingsNotificationsPush {
  enabled?: boolean;
  sound?: string;
}

export interface OrganizationSettingsNotifications {
  email: OrganizationSettingsNotificationsEmail;
  push?: OrganizationSettingsNotificationsPush;
}

export interface Organization {
  id: number;
  name: string;
  settings: {
    theme?: string;
    notifications: OrganizationSettingsNotifications;
  };
}
