export class LineLinkRequiredError extends Error {
  readonly lineUserId: string;
  readonly displayName?: string;
  readonly tenantCode: string;
  readonly returnTo?: string;

  constructor(params: {
    lineUserId: string;
    displayName?: string;
    tenantCode: string;
    returnTo?: string;
  }) {
    super("LINE アカウントの紐付けが必要です");
    this.name = "LineLinkRequiredError";
    this.lineUserId = params.lineUserId;
    this.displayName = params.displayName;
    this.tenantCode = params.tenantCode;
    this.returnTo = params.returnTo;
  }
}
