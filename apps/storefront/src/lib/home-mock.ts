import type { Product } from "@/components/ProductCard";

/** Mock products for homepage sections until Medusa is wired. */
export const homeMockProducts: Product[] = [
  {
    id: "1",
    name: "Gentle Daily Cleanser",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Renser mildt og effektivt uden at udtørre huden",
    variant: "150 ml",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1556228994-efb7c88fa0f9?w=600&q=80",
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: "2",
    name: "Hydrating Moisturizer",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Dybdegående fugt hele dagen for alle hudtyper",
    variant: "50 ml",
    price: 349,
    image:
      "https://images.unsplash.com/photo-1767611033962-6e3124c71450?w=600&q=80",
    rating: 4.8,
    reviewCount: 256,
  },
  {
    id: "3",
    name: "Vitamin C Serum",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Lysere og mere ensartet hud med antioxidant-beskyttelse",
    variant: "30 ml",
    price: 429,
    image:
      "https://images.unsplash.com/photo-1643379850623-7eb6442cd262?w=600&q=80",
    rating: 4.7,
    reviewCount: 184,
  },
  {
    id: "4",
    name: "Daily SPF 50",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Beskytter mod UV-stråler uden hvid aflejring",
    variant: "40 ml",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1689414480286-aae7c21fe1e2?w=600&q=80",
    rating: 4.6,
    reviewCount: 92,
  },
  {
    id: "5",
    name: "Eye Revive Cream",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Reducerer mørke rande og fine linjer",
    variant: "15 ml",
    price: 379,
    image:
      "https://images.unsplash.com/photo-1629732047356-30c7e14e712b?w=600&q=80",
    rating: 4.4,
    reviewCount: 67,
  },
  {
    id: "6",
    name: "Nourishing Night Cream",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Genopbygger og reparerer huden mens du sover",
    variant: "50 ml",
    price: 399,
    image:
      "https://images.unsplash.com/photo-1626498068278-fb9d0bfb6686?w=600&q=80",
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: "7",
    name: "Exfoliating Toner",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Forynger og forfiner hudstrukturen",
    variant: "200 ml",
    price: 279,
    image:
      "https://images.unsplash.com/photo-1556228994-efb7c88fa0f9?w=600&q=80",
    rating: 4.6,
    reviewCount: 145,
  },
  {
    id: "8",
    name: "Hyaluronic Acid Serum",
    brand: "Guapo",
    brandHandle: "guapo",
    benefit: "Intensiv fugtgivende behandling for alle hudtyper",
    variant: "30 ml",
    price: 389,
    image:
      "https://images.unsplash.com/photo-1643379850623-7eb6442cd262?w=600&q=80",
    rating: 4.8,
    reviewCount: 203,
  },
];

export interface RoutineCard {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

export const homeMockRoutines: RoutineCard[] = [
  {
    id: "routine-dry",
    title: "Tør hud",
    description: "Intensiv fugt og næring til tør hud",
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80",
    href: "/concerns/tor-hud",
  },
  {
    id: "routine-oily",
    title: "Fedtet hud",
    description: "Balance og matterende pleje",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=80",
    href: "/concerns/uren-hud",
  },
  {
    id: "routine-combination",
    title: "Kombineret hud",
    description: "Perfekt balance for blandingshud",
    image:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80",
    href: "/concerns/kombineret",
  },
  {
    id: "routine-sensitive",
    title: "Sensitiv hud",
    description: "Mild og beroligende hudpleje",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80",
    href: "/concerns/folsom-hud",
  },
  {
    id: "routine-mature",
    title: "Moden hud",
    description: "Anti-age og foryngende behandling",
    image:
      "https://images.unsplash.com/photo-1556228994-230e57f3f57e?w=400&q=80",
    href: "/concerns/aldringstegn",
  },
];

export interface ContentCard {
  id: string;
  title: string;
  image: string;
  href: string;
  label?: string;
  excerpt?: string;
}

export const homeMockContent: ContentCard[] = [
  {
    id: "content-1",
    title: "5 tegn på at din hud mangler fugt",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    href: "/blog/dehydrated-skin",
    label: "Guide",
    excerpt:
      "Lær at genkende tegnene på dehydreret hud og find de bedste løsninger.",
  },
  {
    id: "content-2",
    title: "Morgen vs. aften rutine: Hvad er forskellen?",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    href: "/blog/skincare-routine",
    label: "Tips",
    excerpt:
      "Din ultimative guide til den perfekte hudplejerutine, dag og nat.",
  },
  {
    id: "content-3",
    title: "Ingrediensguide: Hvad gør retinol?",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    href: "/blog/retinol-guide",
    label: "Guide",
    excerpt:
      "Alt du skal vide om retinol og hvordan du bruger det sikkert.",
  },
];

export interface CategoryLink {
  name: string;
  href: string;
  image?: string;
  emoji?: string;
  color?: string;
}

export const homeMockCategories: CategoryLink[] = [
  { name: "SALE", href: "/categories/sale", emoji: "💸", color: "bg-amber-50" },
  {
    name: "Hudpleje",
    href: "/categories/hudpleje",
    image: "https://images.unsplash.com/photo-1643379850623-7eb6442cd262?w=400&q=80",
    color: "bg-surface-muted",
  },
  { name: "Parfumer", href: "/categories/parfumer", emoji: "🌿", color: "bg-slate-50" },
  { name: "Makeup", href: "/categories/makeup", emoji: "💄", color: "bg-stone-50" },
  { name: "Hår", href: "/categories/har", emoji: "✨", color: "bg-cyan-50" },
  { name: "Helse", href: "/categories/helse", emoji: "🧴", color: "bg-emerald-50" },
  { name: "Sport", href: "/categories/sport", emoji: "🏃", color: "bg-sky-50" },
  { name: "Medicin", href: "/categories/medicin", emoji: "⚕️", color: "bg-teal-50" },
  { name: "Livsstil", href: "/categories/livsstil", emoji: "🏠", color: "bg-zinc-50" },
  { name: "Gavekort", href: "/categories/gavekort", emoji: "🎁", color: "bg-amber-50" },
];
