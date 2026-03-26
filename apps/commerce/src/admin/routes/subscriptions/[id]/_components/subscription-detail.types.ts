export type OrderSummary = {
  id: string
  status?: string
  payment_status?: string
  total?: number
  created_at?: string
  metadata?: Record<string, unknown>
}

export type GroupMember = {
  id: string
  status: string
  cycle_weeks: number
  delivery_count: number
  variant_id: string
}

export type SubscriptionDetail = {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  product_title: string
  variant_title: string
  product_thumbnail: string | null
  status: string
  cycle_weeks: number
  next_renewal_at: string
  last_renewal_at: string | null
  delivery_count: number
  discount_percent: number
  variant_id: string
  quantity: number
  stripe_customer_id: string
  stripe_payment_method_id: string
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
  /** Shipmondo service_point_* snapshot for renewals */
  delivery_data?: Record<string, unknown> | null
  shipping_option_id: string
  skip_next: boolean
  retry_count: number
  next_retry_at: string | null
  on_hold_at?: string | null
  last_failure_reason?: string | null
  group_id: string | null
  linked_orders: OrderSummary[]
  group_members: GroupMember[]
}
