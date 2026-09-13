export type StorageProvider =
  | "vercel-blob"
  | "google-drive";

export type StorageAccess =
  | "public"
  | "private";

export type StorageReadResult = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  statusCode: 200;
};

export type StorageMetadata = {
  size: number;
  uploadedAt: Date;
  pathname: string;
  contentType: string;
  url: string;
  downloadUrl: string;
  etag?: string;
};

export type StorageListObject = {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  etag?: string;
};

export type StorageListOptions = {
  prefix?: string;
  limit?: number;
  cursor?: string;
};

export type StorageListResult = {
  objects: StorageListObject[];
  cursor?: string;
  hasMore: boolean;
};

export interface StorageAdapter {
  readonly provider: StorageProvider;
  readonly access: StorageAccess;

  read(
    locator: string,
  ): Promise<StorageReadResult | null>;

  head(
    locator: string,
  ): Promise<StorageMetadata>;

  delete(
    locator: string | string[],
  ): Promise<void>;
}

export interface ListableStorageAdapter
  extends StorageAdapter {
  list(
    options?: StorageListOptions,
  ): Promise<StorageListResult>;
}
