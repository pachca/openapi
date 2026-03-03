type Redirect = {
  source: string;
  destination: string;
};

const redirects: Redirect[] = [
  // mapper.ts cleanup (2026-03): action verbs + redundant suffix stripping
  { source: '/chats/update-archive', destination: '/chats/archive' },
  { source: '/chats/update-archive.md', destination: '/chats/archive.md' },
  { source: '/chats/update-unarchive', destination: '/chats/unarchive' },
  { source: '/chats/update-unarchive.md', destination: '/chats/unarchive.md' },
  { source: '/members/remove-leave', destination: '/members/leave' },
  { source: '/members/remove-leave.md', destination: '/members/leave.md' },
  { source: '/members/list-members', destination: '/members/list' },
  { source: '/members/list-members.md', destination: '/members/list.md' },
  { source: '/members/add-members', destination: '/members/add' },
  { source: '/members/add-members.md', destination: '/members/add.md' },
  { source: '/members/update-members', destination: '/members/update' },
  { source: '/members/update-members.md', destination: '/members/update.md' },
  { source: '/members/remove-member', destination: '/members/remove' },
  { source: '/members/remove-member.md', destination: '/members/remove.md' },
  { source: '/reactions/list-reactions', destination: '/reactions/list' },
  { source: '/reactions/list-reactions.md', destination: '/reactions/list.md' },
  { source: '/reactions/add-reactions', destination: '/reactions/add' },
  { source: '/reactions/add-reactions.md', destination: '/reactions/add.md' },
  { source: '/reactions/remove-reactions', destination: '/reactions/remove' },
  { source: '/reactions/remove-reactions.md', destination: '/reactions/remove.md' },
  { source: '/thread/add-thread', destination: '/thread/add' },
  { source: '/thread/add-thread.md', destination: '/thread/add.md' },
  { source: '/link-previews/add-link-previews', destination: '/link-previews/add' },
  { source: '/link-previews/add-link-previews.md', destination: '/link-previews/add.md' },
  { source: '/views/create-open', destination: '/views/open' },
  { source: '/views/create-open.md', destination: '/views/open.md' },
  { source: '/profile/profile', destination: '/profile/get' },
  { source: '/profile/profile.md', destination: '/profile/get.md' },
  // mapper.ts: OPERATION_OVERRIDES (2026-03)
  { source: '/read-member/list-read-member-ids', destination: '/read-member/list-readers' },
  { source: '/read-member/list-read-member-ids.md', destination: '/read-member/list-readers.md' },
  // mapper.ts: common section bare CRUD verbs replaced with resource name (2026-03)
  { source: '/common/list', destination: '/common/custom-properties' },
  { source: '/common/list.md', destination: '/common/custom-properties.md' },
  { source: '/common/create', destination: '/common/uploads' },
  { source: '/common/create.md', destination: '/common/uploads.md' },
  // mapper.ts: OPERATION_OVERRIDES — status is singular, not plural (2026-03)
  { source: '/profile/list-status', destination: '/profile/get-status' },
  { source: '/profile/list-status.md', destination: '/profile/get-status.md' },
  { source: '/users/list-status', destination: '/users/get-status' },
  { source: '/users/list-status.md', destination: '/users/get-status.md' },
];

export default redirects;
