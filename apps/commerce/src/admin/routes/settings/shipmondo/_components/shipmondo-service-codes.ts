/** Build Shipmondo service_codes string from notification toggles. */
export function buildServiceCodesString(email: boolean, sms: boolean): string {
  const parts: string[] = []
  if (email) parts.push("EMAIL_NT")
  if (sms) parts.push("SMS_NT")
  return parts.join(",")
}

export function parseServiceCodes(raw: string | undefined): { email: boolean; sms: boolean } {
  if (!raw || typeof raw !== "string") return { email: true, sms: true }
  const parts = raw.split(",").map((s) => s.trim().toUpperCase())
  return {
    email: parts.includes("EMAIL_NT"),
    sms: parts.includes("SMS_NT"),
  }
}
