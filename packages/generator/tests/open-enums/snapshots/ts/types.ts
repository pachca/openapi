export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export enum MemberKind {
  Regular = "regular",
  Guest = "guest",
  Value = "value",
}

/**
 * Member role
 *
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum MemberRole {
  /** Administrator */
  Admin = "admin",
  /** Member */
  User = "user",
}

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum Region {
  Eu = "eu",
  Us = "us",
}

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum MemberStatus {
  Active = "active",
  Suspended = "suspended",
  Unknown = "unknown",
}

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum ErrorCode {
  Blank = "blank",
  Taken = "taken",
}

/**
 * OAuth error code
 *
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum OAuthErrorCode {
  /** The token is missing or revoked */
  InvalidToken = "invalid_token",
  /** The token lacks the scope */
  InsufficientScope = "insufficient_scope",
}

/**
 * A response may carry a value this SDK does not list yet: it arrives as the raw string.
 */
export enum PayloadKind {
  Created = "created",
  Value = "value",
}

export interface Member {
  id: number;
  role: MemberRole;
  status: MemberStatus;
  previousStatuses?: MemberStatus[];
}

export interface MemberUpdateRequest {
  role?: MemberRole;
  kind?: MemberKind;
}

export interface MemberEventPayload {
  kind: PayloadKind;
}

export interface ApiErrorItem {
  key: string;
  message: string;
  code: ErrorCode;
}

export class ApiError extends Error {
  errors?: ApiErrorItem[];
  constructor(errors?: ApiErrorItem[]) {
    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));
    this.errors = errors;
  }
}

export class OAuthError extends Error {
  error?: string;
  constructor(error?: string) {
    super(error);
    this.error = error;
  }
}

export interface ListMembersParams {
  sort?: SortOrder;
  role?: MemberRole;
  roles?: MemberRole[];
  region?: Region;
}

export interface ListMembersResponse {
  data: Member[];
}
