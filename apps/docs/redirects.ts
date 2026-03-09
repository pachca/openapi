type Redirect = {
  source: string;
  destination: string;
};

const redirects: Redirect[] = [
  // ===== Guides: accordion parent → first child =====
  { source: '/guides/forms', destination: '/guides/forms/overview' },

  // ===== Guides → API Reference (переезд из /guides/ в /api/) =====
  { source: '/guides/authorization', destination: '/api/authorization' },
  { source: '/guides/requests-responses', destination: '/api/requests-responses' },
  { source: '/guides/errors', destination: '/api/errors' },

  // ===== API methods: move under /api/ prefix =====
  { source: '/common/:path*', destination: '/api/common/:path*' },
  { source: '/profile/:path*', destination: '/api/profile/:path*' },
  { source: '/users/:path*', destination: '/api/users/:path*' },
  { source: '/group-tags/:path*', destination: '/api/group-tags/:path*' },
  { source: '/chats/:path*', destination: '/api/chats/:path*' },
  { source: '/members/:path*', destination: '/api/members/:path*' },
  { source: '/threads/:path*', destination: '/api/threads/:path*' },
  { source: '/messages/:path*', destination: '/api/messages/:path*' },
  { source: '/read-member/:path*', destination: '/api/read-member/:path*' },
  { source: '/reactions/:path*', destination: '/api/reactions/:path*' },
  { source: '/link-previews/:path*', destination: '/api/link-previews/:path*' },
  { source: '/tasks/:path*', destination: '/api/tasks/:path*' },
  { source: '/views/:path*', destination: '/api/views/:path*' },
  { source: '/bots/update', destination: '/api/bots/update' },
  { source: '/bots/list-events', destination: '/api/bots/list-events' },
  { source: '/bots/remove-event', destination: '/api/bots/remove-event' },
  { source: '/bots/webhooks', destination: '/api/bots/webhooks' },
  { source: '/security/list', destination: '/api/security/list' },
  { source: '/search/:path*', destination: '/api/search/:path*' },

  // ===== mapper.ts cleanup (2026-03): action verbs + redundant suffix stripping =====
  // These old URLs now need /api/ prefix too
  { source: '/chats/update-archive', destination: '/api/chats/archive' },
  { source: '/chats/update-archive.md', destination: '/api/chats/archive.md' },
  { source: '/chats/update-unarchive', destination: '/api/chats/unarchive' },
  { source: '/chats/update-unarchive.md', destination: '/api/chats/unarchive.md' },
  { source: '/members/remove-leave', destination: '/api/members/leave' },
  { source: '/members/remove-leave.md', destination: '/api/members/leave.md' },
  { source: '/members/list-members', destination: '/api/members/list' },
  { source: '/members/list-members.md', destination: '/api/members/list.md' },
  { source: '/members/add-members', destination: '/api/members/add' },
  { source: '/members/add-members.md', destination: '/api/members/add.md' },
  { source: '/members/update-members', destination: '/api/members/update' },
  { source: '/members/update-members.md', destination: '/api/members/update.md' },
  { source: '/members/remove-member', destination: '/api/members/remove' },
  { source: '/members/remove-member.md', destination: '/api/members/remove.md' },
  { source: '/reactions/list-reactions', destination: '/api/reactions/list' },
  { source: '/reactions/list-reactions.md', destination: '/api/reactions/list.md' },
  { source: '/reactions/add-reactions', destination: '/api/reactions/add' },
  { source: '/reactions/add-reactions.md', destination: '/api/reactions/add.md' },
  { source: '/reactions/remove-reactions', destination: '/api/reactions/remove' },
  { source: '/reactions/remove-reactions.md', destination: '/api/reactions/remove.md' },
  { source: '/thread/add-thread', destination: '/api/thread/add' },
  { source: '/thread/add-thread.md', destination: '/api/thread/add.md' },
  { source: '/link-previews/add-link-previews', destination: '/api/link-previews/add' },
  { source: '/link-previews/add-link-previews.md', destination: '/api/link-previews/add.md' },
  { source: '/views/create-open', destination: '/api/views/open' },
  { source: '/views/create-open.md', destination: '/api/views/open.md' },
  { source: '/profile/profile', destination: '/api/profile/get' },
  { source: '/profile/profile.md', destination: '/api/profile/get.md' },
  { source: '/read-member/list-read-member-ids', destination: '/api/read-member/list-readers' },
  {
    source: '/read-member/list-read-member-ids.md',
    destination: '/api/read-member/list-readers.md',
  },
  { source: '/common/list', destination: '/api/common/custom-properties' },
  { source: '/common/list.md', destination: '/api/common/custom-properties.md' },
  { source: '/common/create', destination: '/api/common/uploads' },
  { source: '/common/create.md', destination: '/api/common/uploads.md' },
  { source: '/profile/list-status', destination: '/api/profile/get-status' },
  { source: '/profile/list-status.md', destination: '/api/profile/get-status.md' },
  { source: '/users/list-status', destination: '/api/users/get-status' },
  { source: '/users/list-status.md', destination: '/api/users/get-status.md' },
];

export default redirects;
