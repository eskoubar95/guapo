export async function callSubscriptionAction(
  base: string,
  id: string,
  action: "pause" | "resume" | "cancel" | "skip" | "retry",
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

export async function updateSubscriptionAddresses(
  base: string,
  id: string,
  body: {
    shipping_address?: Record<string, unknown>
    billing_address?: Record<string, unknown>
    delivery_data?: Record<string, unknown> | null
  }
) {
  const res = await fetch(`${base}/admin/subscriptions/${id}/addresses`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { message?: string })?.message ?? "Failed to update addresses")
  }
  return res.json()
}
