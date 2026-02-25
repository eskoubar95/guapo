import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { sendPlunkEmail } from "../lib/plunk";

const STORE_NAME = process.env.PLUNK_STORE_NAME ?? "Guapo";

export default async function inviteEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query");
  const config = container.resolve("configModule") as { admin?: { backendUrl?: string; path?: string } };

  const { data: invites } = await query.graph({
    entity: "invite",
    fields: ["email", "token"],
    filters: { id: data.id },
  });
  const invite = invites?.[0];
  if (!invite?.email || !invite?.token) {
    console.warn("[invite-email] Invite not found or missing email/token:", data.id);
    return;
  }

  const backendUrl =
    config.admin?.backendUrl && config.admin.backendUrl !== "/"
      ? config.admin.backendUrl.replace(/\/$/, "")
      : "http://localhost:9000";
  const adminPath = config.admin?.path ?? "app";
  const inviteUrl = `${backendUrl}/${adminPath}/invite?token=${invite.token}`;

  const subject = `You've been invited to join ${STORE_NAME}`;
  const body = `
    <h2>You've been invited to join ${STORE_NAME}</h2>
    <p>Click the button below to accept the invitation and get started.</p>
    <p><a href="${inviteUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Accept invitation</a></p>
    <p>Or copy this link: ${inviteUrl}</p>
  `.trim();

  const result = await sendPlunkEmail({
    to: invite.email,
    subject,
    body,
  });

  if (result.success) {
    console.info("[invite-email] Invite email sent to", invite.email);
  } else {
    console.error("[invite-email] Plunk send failed:", result.error);
  }
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
};
