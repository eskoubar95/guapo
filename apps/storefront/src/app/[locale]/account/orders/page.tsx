import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mine ordrer" : "My Orders",
    robots: { index: false },
  };
}

// Placeholder orders (will come from Medusa)
const orders = [
  {
    id: "ORD-001",
    date: "2026-01-15",
    status: "delivered",
    total: 42555,
    items: [
      { title: "Gentle Cleanser", quantity: 1 },
      { title: "Niacinamide Serum", quantity: 1 },
    ],
  },
  {
    id: "ORD-002",
    date: "2025-12-20",
    status: "delivered",
    total: 32900,
    items: [
      { title: "Hydrating Moisturizer", quantity: 1 },
    ],
  },
  {
    id: "ORD-003",
    date: "2025-11-05",
    status: "delivered",
    total: 27900,
    items: [
      { title: "Daily SPF 50", quantity: 1 },
    ],
  },
];

const statusLabels: Record<string, { da: string; en: string; color: string }> = {
  pending: { da: "Afventer", en: "Pending", color: "bg-yellow-100 text-yellow-800" },
  processing: { da: "Behandles", en: "Processing", color: "bg-blue-100 text-blue-800" },
  shipped: { da: "Sendt", en: "Shipped", color: "bg-purple-100 text-purple-800" },
  delivered: { da: "Leveret", en: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { da: "Annulleret", en: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href={`/${locale}/account`} className="hover:text-gray-900">
                {dict.account.title}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{dict.account.orders}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">{dict.account.orders}</h1>

        {orders.length > 0 ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-100 p-4 hover:border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusLabels[order.status].color}`}>
                    {statusLabels[order.status][localeKey]}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {order.items.map((item, i) => (
                      <span key={i}>
                        {item.quantity}x {item.title}
                        {i < order.items.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                  <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                </div>

                <div className="mt-4 flex gap-4">
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    {locale === "da" ? "Se detaljer" : "View details"}
                  </button>
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    {locale === "da" ? "Spor pakke" : "Track package"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              {locale === "da" ? "Du har ingen ordrer endnu" : "You have no orders yet"}
            </p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              {locale === "da" ? "Start med at shoppe" : "Start shopping"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
