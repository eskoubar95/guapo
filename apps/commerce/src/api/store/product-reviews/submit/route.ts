import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
const PRODUCT_REVIEW_MODULE = "product_review";

type AuthenticatedStoreRequest = MedusaRequest<{
  product_id: string;
  rating: number;
  content: string;
  headline?: string;
}>;

/**
 * POST /store/product-reviews/submit
 * Create a product review as logged-in customer (no order required).
 * Requires: Authorization Bearer <token> or session cookie.
 */
export const POST = async (req: AuthenticatedStoreRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } }).auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at skrive en anmeldelse.",
      code: "UNAUTHORIZED",
    });
  }

  const customerId = authContext.actor_id;
  const { product_id, rating, content, headline } = req.validatedBody;

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "customer",
    variables: { filters: { id: customerId } },
    fields: ["id", "email", "first_name", "last_name"],
  });
  const customers = await remoteQuery(queryObject);
  const c = (Array.isArray(customers) ? customers[0] : (customers as { rows?: Array<{ email?: string; first_name?: string; last_name?: string }> })?.rows?.[0]) as
    | { email?: string; first_name?: string; last_name?: string }
    | undefined;
  if (!c?.email) {
    return res.status(404).json({
      message: "Kunde ikke fundet.",
      code: "CUSTOMER_NOT_FOUND",
    });
  }

  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

  const contentText = headline ? `${headline}\n\n${content}` : content;

  interface ProductReviewServiceType {
    createProductReviews: (data: unknown[]) => Promise<Array<{ id: string; product_id: string; rating: number; content: string | null; status: string; created_at: Date }>>;
    listProductReviewStats: (
      filters: { product_id: string[] },
      config?: Record<string, unknown>
    ) => Promise<Array<{ product_id: string }>>;
    createProductReviewStats: (data: Array<{ product_id: string }>) => Promise<unknown>;
    refreshProductReviewStats: (productIds: string[]) => Promise<unknown>;
  }
  const productReviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE) as ProductReviewServiceType;
  const [review] = await productReviewService.createProductReviews([
    {
      product_id,
      name,
      email: c.email,
      rating,
      content: contentText,
      order_id: null,
      order_line_item_id: null,
    },
  ]);

  // Ensure stats row exists: plugin refresh only queries existing ProductReviewStats (avoids SQL IN ()).
  const existingStats = await productReviewService.listProductReviewStats(
    { product_id: [product_id] },
    {}
  );
  if (!existingStats.some((row) => row.product_id === product_id)) {
    await productReviewService.createProductReviewStats([{ product_id }]);
  }
  await productReviewService.refreshProductReviewStats([product_id]);

  return res.status(201).json({
    product_review: {
      id: review.id,
      product_id: review.product_id,
      rating: review.rating,
      content: review.content,
      status: review.status,
      created_at: review.created_at,
    },
  });
};
