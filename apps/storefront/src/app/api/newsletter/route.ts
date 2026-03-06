/**
 * POST /api/newsletter
 * Subscribe email to newsletter via Plunk. Adds contact and optionally to General segment.
 * Body: { email: string, acceptPrivacy: boolean }
 */
import { NextResponse } from "next/server";

const PLUNK_BASE = process.env.PLUNK_API_URL ?? "https://next-api.useplunk.com";
const PLUNK_SECRET = process.env.PLUNK_SECRET_API_KEY;
const PLUNK_GENERAL_SEGMENT_ID = process.env.PLUNK_GENERAL_SEGMENT_ID;

export async function POST(req: Request) {
  if (!PLUNK_SECRET) {
    return NextResponse.json(
      { error: "Newsletter not configured" },
      { status: 503 }
    );
  }

  let body: { email?: string; acceptPrivacy?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const acceptPrivacy = body.acceptPrivacy === true;

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  if (!acceptPrivacy) {
    return NextResponse.json(
      { error: "Privacy policy must be accepted" },
      { status: 400 }
    );
  }

  try {
    // Create contact (Plunk: POST /contacts, see next-wiki.useplunk.com/api-reference/overview)
    const createRes = await fetch(`${PLUNK_BASE}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PLUNK_SECRET}`,
      },
      body: JSON.stringify({
        email,
        subscribed: true,
        data: { source: "newsletter", list: "general" },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[newsletter] Plunk create contact failed:", createRes.status, errText);
      return NextResponse.json(
        { error: "Subscription failed" },
        { status: 502 }
      );
    }

    await createRes.json();

    // Add to General segment if segment ID is configured (POST /segments/:id/members – Plunk expects "emails" array)
    if (PLUNK_GENERAL_SEGMENT_ID) {
      const memberRes = await fetch(
        `${PLUNK_BASE}/segments/${PLUNK_GENERAL_SEGMENT_ID}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PLUNK_SECRET}`,
          },
          body: JSON.stringify({ emails: [email] }),
        }
      );

      if (!memberRes.ok) {
        // Contact was created; log but don't fail the request
        const errText = await memberRes.text();
        console.warn("[newsletter] Plunk add to segment failed:", memberRes.status, errText);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}
