import type {
  Actor, ActionCtx, AppInfo, BackgroundCtx, DbReader, DbWriter, FilesReader, FilesWriter, MutationCtx, QueryCtx, Scheduler, Schema,
  UploadSession,
} from '../src/server.ts';

type All<T> = { readonly [K in keyof T]-?: true };
const keys = <T>(record: All<T>) => Object.keys(record).sort();

export const ctx = {
  query: keys<QueryCtx<Schema>>({ actor: true, app: true, db: true, files: true }),
  mutation: keys<MutationCtx<Schema>>({ actor: true, app: true, db: true, files: true, scheduler: true }),
  action: keys<ActionCtx>({ actor: true, app: true, fetch: true, files: true, pachca: true, runMutation: true, runQuery: true, scheduler: true }),
  background: keys<BackgroundCtx>({ actor: true, app: true, fetch: true, files: true, pachca: true, runMutation: true, runQuery: true, scheduler: true }),
  'action.pachca': keys<ActionCtx['pachca']>({ bot: true, user: true }),
  'background.pachca': keys<BackgroundCtx['pachca']>({ bot: true }),
  'db.reader': keys<DbReader<Schema>>({ get: true, query: true }),
  'db.writer': keys<DbWriter<Schema>>({ delete: true, get: true, insert: true, patch: true, query: true }),
  'files.reader': keys<FilesReader>({ metadata: true, url: true }),
  'files.writer': keys<FilesWriter>({ delete: true, generateUploadUrl: true, metadata: true, url: true }),
  scheduler: keys<Scheduler>({ cancel: true, runAfter: true, runAt: true }),
  app: keys<AppInfo>({ id: true, url: true }),
  actor: keys<Actor>({ id: true, role: true }),
};

export const upload = {
  session: keys<UploadSession>({ presignedUpload: true, strategy: true, uploadUrl: true, uploadUuid: true }),
  presigned: keys<NonNullable<UploadSession['presignedUpload']>>({ completeUrl: true, expiresAt: true, headers: true, method: true, proxyS3Url: true, url: true }),
  strategies: keys<Record<UploadSession['strategy'][number], true>>({ presigned_upload: true, proxy_s3_url: true, upload_url: true }),
  request: keys<Parameters<FilesWriter['generateUploadUrl']>[0]>({ checksum: true, contentType: true, filename: true, size: true }),
};
