import { NextResponse } from "next/server";

export function jsonOk<T extends object>(
  data: T,
  requestId: string,
  status = 200,
) {
  return NextResponse.json({ requestId, ...data }, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      requestId,
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status },
  );
}

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
