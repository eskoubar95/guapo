// @ts-nocheck
import { Text } from "@medusajs/ui"

const STEPS = [
  { id: 1, label: "Lande" },
  { id: 2, label: "Carriers" },
  { id: 3, label: "Produkter" },
  { id: 4, label: "Bekræft" },
] as const

export type WizardStepId = 1 | 2 | 3 | 4

export function WizardStepIndicator({ current }: { current: WizardStepId }) {
  return (
    <nav aria-label="Trin i katalog" className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-1 sm:gap-x-2">
        {STEPS.map((s, i) => {
          const done = current > s.id
          const active = current === s.id
          return (
            <div key={s.id} className="flex min-w-0 flex-1 basis-[45%] items-center gap-2 sm:basis-0">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm ${
                  done
                    ? "bg-ui-button-inverted text-ui-bg-base"
                    : active
                      ? "bg-ui-bg-interactive text-ui-fg-on-color"
                      : "border border-ui-border-base bg-ui-bg-subtle text-ui-fg-muted"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : s.id}
              </div>
              <Text size="small" className={`min-w-0 truncate ${active ? "text-ui-fg-base" : "text-ui-fg-muted"}`}>
                {s.label}
              </Text>
              {i < STEPS.length - 1 ? (
                <div className="mx-1 hidden h-px min-w-[8px] flex-1 bg-ui-border-base sm:block" aria-hidden />
              ) : null}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
