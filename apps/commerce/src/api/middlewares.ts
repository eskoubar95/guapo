import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";

const submitReviewSchema = z.object({
  product_id: z.string().min(1),
  rating: z.number().min(1).max(5),
  content: z.string().min(1).max(5000),
  headline: z.string().max(200).optional(),
});

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/product-reviews/submit",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(submitReviewSchema),
      ],
    },
    {
      matcher: "/store/subscriptions*",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/subscriptions*",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
});
