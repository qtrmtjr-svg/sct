import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { createTicket } from "@/models/records.repository";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120),
  message: z.string().trim().min(8).max(1000),
});

export async function sendTicket(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "message") return { ok: false, code: "invalid_message" };
    if (field === "name") return { ok: false, code: "invalid_name" };
    return { ok: false, code: "invalid_email" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.email)) {
    return { ok: false, code: "invalid_email" };
  }
  try {
    await createTicket({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
