import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { buildGuapoEmailDocument, ctaButton, escapeHtml } from "../lib/transactional-email/email-layout";
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
  const adminPath = (config.admin?.path ?? "/app").replace(/^\//, "");
  const inviteUrl = `${backendUrl}/${adminPath}/invite?token=${invite.token}`;

  const subject = `You've been invited to join ${STORE_NAME}`;
  const pIntro =
    "margin:0 0 16px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#4a5568;text-align:center;";
  const pMuted =
    "margin:16px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#7b8599;text-align:center;word-break:break-all;";
  const body = buildGuapoEmailDocument({
    lang: "en",
    documentTitle: subject,
    preheader: `Accept your invitation to join the ${STORE_NAME} admin team.`,
    heroTitle: "You're invited",
    heroSubtitle: `${escapeHtml(STORE_NAME)} Admin`,
    mainHtml: `
      <p style="${pIntro}">You have been invited to join <strong style="color:#0a0e1a;">${escapeHtml(STORE_NAME)}</strong> on Medusa Admin. Click the button below to accept and set up your account.</p>
      <div style="margin:8px 0 24px 0;text-align:center;">
        ${ctaButton(inviteUrl, "Accept invitation")}
      </div>
      <p style="${pMuted}">If the button does not work, copy and paste this link into your browser:<br>${escapeHtml(inviteUrl)}</p>
    `.trim(),
    closingTitle: "We will see you\nin the dashboard",
    closingSubtitle: "This link is personal — do not share it.",
    closingBody: "",
    footerLegal:
      "You are receiving this email because an administrator invited you to Guapo Admin. If this was a mistake, you can ignore this message.",
  });

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
