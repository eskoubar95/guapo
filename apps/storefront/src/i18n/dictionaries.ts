import { cache } from "react";
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
  search: {
    placeholder: string;
    recentSearches: string;
    clearRecent: string;
    popularSearches: string;
    shortcuts: string;
    bestsellers: string;
    bestsellersSub: string;
    newArrivals: string;
    newArrivalsSub: string;
    products: string;
    articles: string;
    resultsCount: string;
    resultCount: string;
    noResults: string;
    tryDifferent: string;
    searching: string;
    selectHint: string;
    closeHint: string;
    minChars: string;
    viewAllResults: string;
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
      previousSlide: string;
      nextSlide: string;
      goToSlide: string;
      pauseAutoplay: string;
      playAutoplay: string;
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
    /** Remaining count, e.g. "Kun {{count}} tilbage på lager" */
    lowStockWithCount: string;
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
      ratingLabel: string;
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
    goToCart: string;
    addedToCart: string;
    shopVidere: string;
    seKurv: string;
    totalDiscount: string;
    freeShippingProgress: string;
    addedAsSubscription: string;
    youSavePerTime: string;
    cartTotalCount: string;
    clearCart: string;
    /** Shown when quantity cannot exceed available inventory */
    notEnoughStock: string;
    /** Non-inventory failure updating line quantity */
    quantityUpdateFailed: string;
  };
  wishlist: {
    title: string;
    empty: string;
    addToWishlist: string;
    removeFromWishlist: string;
    goToShop: string;
    saveToAccount: string;
    loading: string;
    saving: string;
    saved: string;
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
    shippingMethodRequired: string;
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
    backLink?: string;
    loginDescription?: string;
    registerDescription?: string;
    authRequiredMessage?: string;
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
    orderRenewalLabel?: string;
    orderSubscriptionLineLabel?: string;
    menuLabel?: string;
    closeMenu?: string;
    profileTitle: string;
    profileSaved: string;
    profileError: string;
    saving: string;
    save: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressTitle: string;
    billingAddress: string;
    address: string;
    postalCode: string;
    city: string;
    addressSaved: string;
    addressError: string;
    preferredPickupPoint: string;
    noPickupPointSaved: string;
    searchPickupPoint: string;
    pickupPointSaved: string;
    pickupPointError: string;
    change: string;
    cancel: string;
  };
  orderConfirmation: {
    title: string;
    subtitle: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    viewOrder: string;
    continueShopping: string;
    summary: string;
    items: string;
    subtotal: string;
    shipping: string;
    total: string;
    freeShipping: string;
    deliveryAddress: string;
    pickupPoint: string;
    pickupPointHint: string;
    subscriptionTitle: string;
    subscriptionText: string;
    manageSubscriptions: string;
    tracking: string;
    trackPackage: string;
    paymentMethod: string;
    paymentCardEnding: string;
    paymentCardBrand: string;
    confirming: string;
    errorMessage: string;
    backToCheckout: string;
    orderLoadError: string;
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
    cancelKeepButton: string;
    cancelSubmitButton: string;
    cancelLoadingLabel: string;
    cancelSuccessTitle: string;
    cancelSuccessBody: string;
    cancelCloseButton: string;
    cancelTryAgain: string;
    subscriptionLinesTitle: string;
    orderHistoryTitle: string;
    discountIncluded: string;
    openOrderHistory: string;
  };
  blog: {
    title: string;
    intro: string;
    empty: string;
    readMore: string;
    backToBlog: string;
    featuredHeading: string;
    moreArticles: string;
    categories: {
      "skincare-tips": string;
      "product-guides": string;
      ingredients: string;
      routines: string;
      news: string;
    };
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

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
});
