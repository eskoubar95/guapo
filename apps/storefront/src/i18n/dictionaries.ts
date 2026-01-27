import type { Locale } from "./config";

// Dictionary structure for type safety
export interface Dictionary {
  common: {
    brand: string;
    search: string;
    cart: string;
    account: string;
    signIn: string;
    signOut: string;
    language: string;
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
    };
    featured: {
      title: string;
    };
    newArrivals: {
      title: string;
    };
  };
  products: {
    addToCart: string;
    outOfStock: string;
    viewDetails: string;
    filters: string;
    sort: string;
    noResults: string;
  };
  cart: {
    title: string;
    empty: string;
    continueShopping: string;
    checkout: string;
    subtotal: string;
    shipping: string;
    total: string;
    remove: string;
  };
  checkout: {
    title: string;
    shipping: string;
    payment: string;
    review: string;
    placeOrder: string;
  };
  footer: {
    support: string;
    policies: string;
    followUs: string;
    newsletter: string;
    subscribe: string;
    copyright: string;
  };
}

// Dictionaries for each locale
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  da: () => import("./dictionaries/da.json").then((module) => module.default),
  en: () => import("./dictionaries/en.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
