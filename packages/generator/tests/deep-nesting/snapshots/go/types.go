package pachca

type OrganizationSettingsNotificationsEmail struct {
	Enabled   bool    `json:"enabled"`
	Frequency *string `json:"frequency,omitempty"`
}

type OrganizationSettingsNotificationsPush struct {
	Enabled *bool   `json:"enabled,omitempty"`
	Sound   *string `json:"sound,omitempty"`
}

type OrganizationSettingsNotifications struct {
	Email OrganizationSettingsNotificationsEmail `json:"email"`
	Push  *OrganizationSettingsNotificationsPush `json:"push,omitempty"`
}

type OrganizationSettings struct {
	Notifications OrganizationSettingsNotifications `json:"notifications"`
	Theme         *string                           `json:"theme,omitempty"`
}

type Organization struct {
	ID       int32                `json:"id"`
	Name     string               `json:"name"`
	Settings OrganizationSettings `json:"settings"`
}
