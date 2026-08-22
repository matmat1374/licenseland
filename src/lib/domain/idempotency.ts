// Domain adapter: idempotency with DB-backed store
import { db } from "@/lib/db";

export async function runOnce<T>(args: {
  key: string;
  fingerprint: string;
  fn: () => Promise<T>;
}): Promise<T> {
  const existing = await db.idempotencyKey.findUnique({ where: { key: args.key } });
  if (existing) {
    if (existing.requestId !== args.fingerprint) {
      throw new Error(`Idempotency conflict: key ${args.key} reused with different payload`);
    }
    if (existing.status === "completed" && existing.response) {
      return JSON.parse(existing.response) as T;
    }
    throw new Error(`Idempotency in-flight: key ${args.key} is already being processed`);
  }
  await db.idempotencyKey.create({
    data: { key: args.key, requestId: args.fingerprint, status: "in_flight" },
  });
  try {
    const result = await args.fn();
    await db.idempotencyKey.update({
      where: { key: args.key },
      data: { status: "completed", response: JSON.stringify(result), completedAt: new Date() },
    });
    return result;
  } catch (e) {
    await db.idempotencyKey.update({
      where: { key: args.key },
      data: { status: "failed" },
    });
    throw e;
  }
}
