export async function callSubscriptionAction(
  base: string,
  id: string,
  action: "pause" | "resume" | "cancel" | "skip",
  body?: Record<string, unknown>
) {
  const res = await fetch(`${base}/admin/subscriptions/${id}/${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { message?: string })?.message ?? `Failed to ${action}`)
  }
  return res.json()
}
