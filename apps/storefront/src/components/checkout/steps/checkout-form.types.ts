export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  postalCode: string;
  city: string;
  phone: string;
  /** Marketing / newsletter opt-in (UI state; extend cart/customer sync if needed). */
  marketingOptIn: boolean;
}
