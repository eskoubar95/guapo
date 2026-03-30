import type { Locale } from "./config";

// Dictionary structure for type safety
export interface Dictionary {
  common: {
    brand: string;
    breadcrumbRoot: string;
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
    announcement: {
      text: string;
      subtext: string;
    };
    promoBars: {
      bar1: { text: string; subtext: string };
      bar2: { text: string; subtext: string };
    };
    promoSlider: {
      slide1: {
        badge: string;
        title: string;
        subtitle: string;
        disclaimer: string;
        ctaText: string;
      };
      slide2: {
        title: string;
        subtitle: string;
        ctaText: string;
      };
      slide3: {
        title: string;
        subtitle: string;
        ctaText: string;
        ctaVariant: string;
      };
    };
    promo: {
      badge: string;
      title: string;
      subtitle: string;
      disclaimer: string;
      ctaText: string;
    };
    campaign: {
      title: string;
      description: string;
      ctaText: string;
    };
    featured: {
      title: string;
    };
    editorPicks: string;
    newArrivals: {
      title: string;
    };
    routine: {
      title: string;
      subtitle: string;
    };
    content: {
      title: string;
      subtitle: string;
    };
    brandSpotlight: {
      description: string;
      cta: string;
    };
    newsletter: {
      title: string;
      description: string;
      placeholder: string;
      submitLabel: string;
    };
  };
  products: {
    addToCart: string;
    outOfStock: string;
    viewDetails: string;
    filters: string;
    clearFilters: string;
    activeFilters: string;
    sort: string;
    noResults: string;
    relatedTitle: string;
    tabs: {
      description: string;
      ingredients: string;
      specifications: string;
    };
    skinTypes: string;
    targets: string;
    keyIngredients: string;
    howToUse: string;
    when: string;
    volume: string;
    notSpecified: string;
    quantity: string;
    size: string;
    added: string;
    purchaseOptions: string;
    decreaseQuantity: string;
    increaseQuantity: string;
    trustStrip: {
      freeShipping: string;
      returns: string;
      securePayment: string;
    };
    reviews: {
      title: string;
      count: string;
      count_plural: string;
      noReviews: string;
      reviewAfterPurchase: string;
      responseLabel: string;
      writeReview: string;
      writeReviewTitle: string;
      headline: string;
      headlinePlaceholder: string;
      reviewText: string;
      reviewTextPlaceholder: string;
      submitReview: string;
      loginToReview: string;
      loginLink: string;
      wasHelpful: string;
      yes: string;
      no: string;
      submitting: string;
      errorSubmit: string;
      successSubmit: string;
    };
  };
  cart: {
    title: string;
    empty: string;
    continueShopping: string;
    checkout: string;
    subtotal: string;
    shipping: string;
    total: string;
    summary: string;
    remove: string;
    decreaseQuantity: string;
    increaseQuantity: string;
    oneTimePurchase: string;
    subscribe: string;
    discountCodeLabel: string;
    discountCodePlaceholder: string;
    apply: string;
    discountApplied: string;
    continueShoppingTitle: string;
    products: string;
    deliveryAndPickup: string;
    overview: string;
    itemsTotal: string;
    subscriptionDiscount: string;
    freeShippingLabel: string;
    totalInclVat: string;
    continueShoppingButton: string;
    subscribeAndSave: string;
    youSave: string;
    deliveryLabel: string;
    everyXWeeks: string;
    goToShop: string;
    itemsInCart: string;
    clearCart: string;
    notEnoughStock: string;
    quantityUpdateFailed: string;
    totalDiscount: string;
    goToCart: string;
    youSavePerTime: string;
    addedAsSubscription: string;
    calculatedAtCheckout: string;
    inclVatBreakdown: string;
  };
  checkout: {
    title: string;
    contact: string;
    shipping: string;
    payment: string;
    review: string;
    placeOrder: string;
    backToCart: string;
    deliveryMethod: string;
    homeDelivery: string;
    homeDeliverySub: string;
    parcelShop: string;
    parcelShopSub: string;
    expressDelivery: string;
    expressDeliverySub: string;
    freeLabel: string;
    continueToPayment: string;
    nextStep: string;
    previousStep: string;
    shippingAddress: string;
    editInfo: string;
    yourInfo: string;
    yourOrder: string;
    acceptTerms: string;
    termsText: string;
    termsLink: string;
    acceptSubscriptionTerms: string;
    subscriptionTermsText: string;
    subscriptionTermsLink: string;
    privacyLink: string;
    glsPakkeshop: string;
    daoPakkeshop: string;
    postnordPakkeshop: string;
    subscriptionNote: string;
    processing: string;
    searchPakkeshop: string;
    selectedPakkeshop: string;
    postalCode: string;
    search: string;
    searching: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    guestCheckoutNote: string;
    marketingOptIn: string;
    deliveryInfo: string;
    paymentMethod: string;
    confirmOrder: string;
    loadingPayment: string;
    paymentError: string;
    addressRequired: string;
    billingRequired: string;
    selectPakkeshop: string;
    confirmPakkeshop: string;
    chooseCarrier: string;
    searchAddressPlaceholder: string;
    openingHours: string;
    paymentDetailsHint: string;
    processingPaymentTitle: string;
    processingPaymentSubtitle: string;
    cardPaymentLabel: string;
    cardPaymentNetworks: string;
    mobilePayPaymentSub: string;
    klarnaPaymentSub: string;
    subscriptionPaymentRestriction: string;
    termsAcceptBeforeTermsLink: string;
    termsAcceptAfterTermsBeforePrivacyLink: string;
    termsAcceptAfterPrivacyLink: string;
    guestFirstNamePlaceholder: string;
    guestLastNamePlaceholder: string;
    mobilePayLabel: string;
    klarnaLabel: string;
    paymentInitFailed: string;
    calculatedWhenDeliverySelected: string;
    vatIncludedBreakdown: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    closeLabel: string;
    email: string;
    password: string;
    submitLogin: string;
    loginWithGoogle: string;
    errorLogin: string;
    noAccount: string;
    registerLink: string;
    orDivider: string;
    firstName: string;
    lastName: string;
    submitRegister: string;
    errorRegister: string;
    hasAccount: string;
    loginLink: string;
  };
  account: {
    title: string;
    overview: string;
    orders: string;
    subscriptions: string;
    profile: string;
    addresses: string;
    signOut: string;
    loading: string;
  };
  orderConfirmation: {
    title: string;
    subtitle: string;
    orderNumber: string;
    viewOrder: string;
    continueShopping: string;
    summary: string;
    subtotal: string;
    shipping: string;
    total: string;
    confirming: string;
    errorMessage: string;
    backToCheckout: string;
  };
  subscriptionDetail: {
    title: string;
    price: string;
    frequency: string;
    nextDelivery: string;
    deliveries: string;
    skipNext: string;
    pause: string;
    changeFrequency: string;
    resume: string;
    cancel: string;
    cancelAfter: string;
    benefitsTitle: string;
    benefitSave: string;
    benefitShipping: string;
    benefitFlexible: string;
    backToSubscriptions: string;
    viewDetails: string;
    cancelConfirm: string;
    cancelConfirmTitle: string;
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
