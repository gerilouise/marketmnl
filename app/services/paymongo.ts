import axios from "axios";

// For web browser testing
const BACKEND_URL = "http://192.168.1.4:3000";

export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  id?: string;
}

export interface CreateCheckoutSessionRequest {
  amount: number;
  description: string;
  paymentMethodTypes: string[];
  successUrl: string;
  failedUrl: string;
  metadata?: Record<string, any>;
  items: CheckoutItem[];
}

export interface CheckoutSessionResponse {
  id: string;
  type: string;
  attributes: {
    checkout_url: string;
    client_key: string;
    description: string;
    livemode: boolean;
    payment_method_types: string[];
    status: string;
    amount: number;
    currency: string;
  };
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionRequest,
): Promise<CheckoutSessionResponse> => {
  try {
    console.log(
      "📤 Sending request to backend:",
      `${BACKEND_URL}/api/create-checkout-session`,
    );
    console.log("📦 Request data:", params);

    const response = await axios.post(
      `${BACKEND_URL}/api/create-checkout-session`,
      {
        amount: params.amount,
        description: params.description,
        paymentMethodTypes: params.paymentMethodTypes,
        successUrl: params.successUrl,
        failedUrl: params.failedUrl,
        metadata: params.metadata,
        items: params.items,
      },
    );

    console.log("✅ Backend response:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.checkoutSession;
  } catch (error: any) {
    console.error("❌ Error creating checkout session:", error.message);
    throw new Error(
      error.response?.data?.error || "Failed to create checkout session",
    );
  }
};
