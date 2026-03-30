import type { CheckoutFormData } from "./checkout-form.types";

export const DEFAULT_CHECKOUT_FORM_DATA: CheckoutFormData = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  postalCode: "",
  city: "",
  phone: "",
  marketingOptIn: false,
};

export function canConfirmCheckoutContact(formData: CheckoutFormData): boolean {
  return Boolean(
    formData.email.trim() &&
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.address1.trim() &&
      formData.postalCode.trim() &&
      formData.city.trim()
  );
}
