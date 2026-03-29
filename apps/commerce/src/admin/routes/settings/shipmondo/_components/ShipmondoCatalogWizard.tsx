// @ts-nocheck
import { Button, FocusModal, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ApiCarrierOption, CatalogProductRich } from "./shipmondo-admin.types"
import { WizardStepConfirm } from "./WizardStepConfirm"
import { WizardStepCarriers } from "./WizardStepCarriers"
import { WizardStepCountries } from "./WizardStepCountries"
import { WizardStepIndicator, type WizardStepId } from "./WizardStepIndicator"
import { WizardStepProducts } from "./WizardStepProducts"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

function groupByCarrier(products: CatalogProductRich[]): Map<string, CatalogProductRich[]> {
  const m = new Map<string, CatalogProductRich[]>()
  for (const p of products) {
    const k = (p.carrier_code ?? "unknown").toLowerCase()
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(p)
  }
  return m
}

async function fetchProductsForCarrier(
  receiver: string,
  sender: string,
  carrierCode: string
): Promise<CatalogProductRich[]> {
  const params = new URLSearchParams({
    receiver_country_code: receiver,
    country_code: receiver,
    sender_country_code: sender.trim() || receiver,
    service_point_only: "false",
    carrier_code: carrierCode.toLowerCase(),
  })
  const res = await fetch(`${BASE}/admin/shipmondo/products?${params}`, { credentials: "include" })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((j && j.message) || `Produkter for ${carrierCode}`)
  }
  return j.products ?? []
}

export function ShipmondoCatalogWizard({ onApplied }: { onApplied: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<WizardStepId>(1)
  const [receiver, setReceiver] = useState("DK")
  const [sender, setSender] = useState("DK")
  const [loadingCarriers, setLoadingCarriers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [applying, setApplying] = useState(false)
  const [apiCarriers, setApiCarriers] = useState<ApiCarrierOption[]>([])
  const [catalog, setCatalog] = useState<CatalogProductRich[]>([])
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(() => new Set())
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(() => new Set())
  const [notificationByCode, setNotificationByCode] = useState<Map<string, { email: boolean; sms: boolean }>>(
    () => new Map()
  )
  const wizardSessionRef = useRef(0)

  const grouped = useMemo(() => groupByCarrier(catalog), [catalog])
  const productByCode = useMemo(() => new Map(catalog.map((p) => [p.code, p])), [catalog])

  const groupedForProducts = useMemo(() => {
    const m = new Map<string, CatalogProductRich[]>()
    for (const [k, list] of grouped.entries()) {
      if (selectedCarriers.has(k)) m.set(k, list)
    }
    return m
  }, [grouped, selectedCarriers])

  const resetWizardState = useCallback(() => {
    setStep(1)
    setApiCarriers([])
    setCatalog([])
    setSelectedCarriers(new Set())
    setSelectedProducts(new Set())
    setNotificationByCode(new Map())
    setLoadingCarriers(false)
    setLoadingProducts(false)
  }, [])

  useEffect(() => {
    wizardSessionRef.current += 1
    if (open) {
      resetWizardState()
    }
  }, [open, resetWizardState])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      // Invalidate current async session immediately when closing.
      wizardSessionRef.current += 1
    }
    setOpen(nextOpen)
  }, [])

  const handleToggleCarrier = (carrierKey: string, on: boolean) => {
    setSelectedCarriers((prev) => {
      const next = new Set(prev)
      if (on) next.add(carrierKey)
      else next.delete(carrierKey)
      return next
    })
  }

  const handleToggleProduct = (code: string) => {
    const wasOn = selectedProducts.has(code)
    if (wasOn) {
      setSelectedProducts((prev) => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })
      return
    }
    setSelectedProducts((prev) => new Set(prev).add(code))
    const p = productByCode.get(code)
    if (p) {
      setNotificationByCode((m) => {
        if (m.has(code)) return m
        const copy = new Map(m)
        const req = new Set((p.required_services ?? []).map((s) => s.code))
        const avail = new Set((p.available_services ?? []).map((s) => s.code))
        copy.set(code, {
          email: req.has("EMAIL_NT") || avail.has("EMAIL_NT"),
          sms: req.has("SMS_NT") || avail.has("SMS_NT"),
        })
        return copy
      })
    }
  }

  const handleToggleCarrierProducts = (carrierKey: string, on: boolean) => {
    const list = groupedForProducts.get(carrierKey) ?? []
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      for (const p of list) {
        if (on) next.add(p.code)
        else next.delete(p.code)
      }
      return next
    })
    if (on) {
      setNotificationByCode((m) => {
        const copy = new Map(m)
        for (const p of list) {
          if (copy.has(p.code)) continue
          const req = new Set((p.required_services ?? []).map((s) => s.code))
          const avail = new Set((p.available_services ?? []).map((s) => s.code))
          copy.set(p.code, {
            email: req.has("EMAIL_NT") || avail.has("EMAIL_NT"),
            sms: req.has("SMS_NT") || avail.has("SMS_NT"),
          })
        }
        return copy
      })
    }
  }

  const handleNotificationChange = (productCode: string, field: "email" | "sms", value: boolean) => {
    setNotificationByCode((m) => {
      const copy = new Map(m)
      const cur = copy.get(productCode) ?? { email: true, sms: true }
      copy.set(productCode, { ...cur, [field]: value })
      return copy
    })
  }

  const loadCarriers = useCallback(async () => {
    const sessionId = wizardSessionRef.current
    setLoadingCarriers(true)
    try {
      const res = await fetch(`${BASE}/admin/shipmondo/carriers`, { credentials: "include" })
      const j = await res.json().catch(() => ({}))
      if (!open || wizardSessionRef.current !== sessionId) return
      if (!res.ok) {
        toast.error(j?.message || "Kunne ikke hente carriers")
        setApiCarriers([])
        return
      }
      const list = Array.isArray(j.carriers) ? j.carriers : []
      setApiCarriers(list)
      setSelectedCarriers(new Set())
      if (list.length === 0) {
        toast.info("Ingen carriers", { description: "Tjek Shipmondo-konto og API-nøgler." })
      }
      setStep(2)
    } catch (e) {
      if (!open || wizardSessionRef.current !== sessionId) return
      toast.error(e instanceof Error ? e.message : "Netværksfejl")
      setApiCarriers([])
    } finally {
      if (open && wizardSessionRef.current === sessionId) {
        setLoadingCarriers(false)
      }
    }
  }, [open])

  const loadProductsForCarriers = useCallback(async () => {
    const codes = Array.from(selectedCarriers)
    const normalizedSender = sender.trim() || receiver
    const sessionId = wizardSessionRef.current
    setLoadingProducts(true)
    try {
      const results = await Promise.all(
        codes.map((c) =>
          fetchProductsForCarrier(receiver, normalizedSender, c).catch((err) => {
            toast.error(err instanceof Error ? err.message : String(err))
            return [] as CatalogProductRich[]
          })
        )
      )
      if (!open || wizardSessionRef.current !== sessionId) return
      const merged = new Map<string, CatalogProductRich>()
      for (const arr of results) {
        for (const p of arr) {
          if (p?.code) merged.set(p.code, p)
        }
      }
      const list = Array.from(merged.values())
      setCatalog(list)
      setSelectedProducts(new Set())
      setNotificationByCode(new Map())
      if (list.length === 0) {
        toast.info("Ingen produkter", { description: "Tjek carrier- og landevalg." })
      }
      setStep(3)
    } finally {
      if (open && wizardSessionRef.current === sessionId) {
        setLoadingProducts(false)
      }
    }
  }, [open, receiver, sender, selectedCarriers])

  const handleNext = async () => {
    if (step === 1) {
      await loadCarriers()
      return
    }
    if (step === 2) {
      if (selectedCarriers.size === 0) {
        toast.error("Vælg mindst én carrier")
        return
      }
      await loadProductsForCarriers()
      return
    }
    if (step === 3) {
      if (selectedProducts.size === 0) {
        toast.error("Vælg mindst ét produkt")
        return
      }
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setApiCarriers([])
      setSelectedCarriers(new Set())
      return
    }
    if (step === 3) {
      setStep(2)
      setCatalog([])
      setSelectedProducts(new Set())
      setNotificationByCode(new Map())
      return
    }
    if (step === 4) setStep(3)
  }

  const apply = useCallback(async () => {
    if (selectedProducts.size === 0) {
      toast.error("Vælg mindst ét produkt")
      return
    }
    const sessionId = wizardSessionRef.current
    const normalizedSender = sender.trim() || receiver
    setApplying(true)
    try {
      const product_selections = Array.from(selectedProducts).map((code) => {
        const p = productByCode.get(code)
        const n = notificationByCode.get(code) ?? { email: true, sms: true }
        const req = new Set((p?.required_services ?? []).map((s) => s.code))
        return {
          product_code: code,
          carrier_code: p?.carrier_code?.trim() || undefined,
          email_notification: req.has("EMAIL_NT") ? true : n.email,
          sms_notification: req.has("SMS_NT") ? true : n.sms,
        }
      })
      const res = await fetch(`${BASE}/admin/shipmondo/catalog/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_country: receiver,
          sender_country: normalizedSender,
          product_selections,
          service_point_only: false,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(j?.message || "Kunne ikke gemme")
        return
      }
      if (Array.isArray(j.errors) && j.errors.length > 0) {
        toast.info(j.message || "Delvist opdateret", { description: j.errors.join("\n") })
      } else {
        toast.success(j.message || "Opdateret")
      }
      if (wizardSessionRef.current !== sessionId) {
        return
      }
      setOpen(false)
      try {
        await onApplied()
      } catch {
        toast.info("Kataloget blev gemt, men listen kunne ikke genindlæses endnu.")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fejl")
    } finally {
      setApplying(false)
    }
  }, [selectedProducts, notificationByCode, productByCode, receiver, sender, onApplied])

  const nextDisabled =
    loadingProducts ||
    (step === 2 && selectedCarriers.size === 0) ||
    (step === 3 && selectedProducts.size === 0)

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => handleOpenChange(true)}>
        Tilføj fra Shipmondo
      </Button>

      <FocusModal open={open} onOpenChange={handleOpenChange}>
        <FocusModal.Content className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden rounded-xl shadow-xl">
          <FocusModal.Header className="border-b border-ui-border-base px-6 py-4">
            <FocusModal.Title className="text-lg">Opsæt levering fra Shipmondo</FocusModal.Title>
            <FocusModal.Description className="text-ui-fg-subtle mt-1 text-sm">
              Trin for trin: lande → carriers fra API → produkter pr. carrier → bekræft.
            </FocusModal.Description>
          </FocusModal.Header>

          <div className="border-b border-ui-border-base px-6 pt-2">
            <WizardStepIndicator current={step} />
          </div>

          <div className="relative min-h-[200px] flex-1 overflow-y-auto px-6 py-5">
            {step === 1 ? (
              <WizardStepCountries
                receiver={receiver}
                sender={sender}
                onReceiverChange={setReceiver}
                onSenderChange={setSender}
              />
            ) : null}

            {step === 2 ? (
              <div className="relative">
                {loadingProducts ? (
                  <div
                    className="bg-ui-bg-base/85 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg backdrop-blur-[1px]"
                    aria-busy
                  >
                    <Text className="text-ui-fg-base">Henter produkter for valgte carriers…</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Et øjeblik
                    </Text>
                  </div>
                ) : null}
                <WizardStepCarriers
                  carriers={apiCarriers}
                  selectedCarrierKeys={selectedCarriers}
                  onToggleCarrier={handleToggleCarrier}
                  loading={loadingCarriers}
                  receiver={receiver}
                  sender={sender}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <WizardStepProducts
                grouped={grouped}
                selectedCarrierKeys={selectedCarriers}
                selectedProductCodes={selectedProducts}
                onToggleProduct={handleToggleProduct}
                onToggleCarrierProducts={handleToggleCarrierProducts}
                notificationByCode={notificationByCode}
                onNotificationChange={handleNotificationChange}
              />
            ) : null}

            {step === 4 ? (
              <WizardStepConfirm
                grouped={grouped}
                selectedCarrierKeys={selectedCarriers}
                selectedProductCodes={selectedProducts}
                notificationByCode={notificationByCode}
              />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ui-border-base bg-ui-bg-subtle-hover/30 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                Luk
              </Button>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loadingCarriers || loadingProducts}
                  onClick={handleBack}
                >
                  Tilbage
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={step === 1 ? loadingCarriers : nextDisabled}
                  onClick={() => void handleNext()}
                >
                  {step === 1 && loadingCarriers
                    ? "Henter…"
                    : step === 2 && loadingProducts
                      ? "Henter…"
                      : "Næste"}
                </Button>
              ) : (
                <Button type="button" variant="primary" disabled={applying} onClick={() => void apply()}>
                  {applying ? "Gemmer…" : "Tilføj til shop"}
                </Button>
              )}
            </div>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}
