import { PRODUCTS } from "@/lib/store/catalog";

const productIds = PRODUCTS.map((product) => product.id);

export const EMPTY_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false
} as const;

export const POLICY_SUMMARY_SCHEMA = EMPTY_SCHEMA;

export const SEARCH_PRODUCTS_SCHEMA = {
  type: "object",
  properties: {
    query: {
      type: "string",
      minLength: 1,
      maxLength: 120,
      description: "Product need or keywords, for example ‘noise-canceling headphones’."
    },
    maxPrice: {
      type: "number",
      minimum: 0,
      maximum: 5000,
      description: "Optional maximum price in USD."
    }
  },
  required: ["query"],
  additionalProperties: false
} as const;

export const GET_PRODUCT_SCHEMA = {
  type: "object",
  properties: {
    productId: {
      type: "string",
      enum: productIds,
      description: "Exact GuardMart product ID returned by search_products."
    }
  },
  required: ["productId"],
  additionalProperties: false
} as const;

export const ADD_TO_CART_SCHEMA = {
  type: "object",
  properties: {
    productId: {
      type: "string",
      enum: productIds,
      description: "Exact GuardMart product ID to add."
    },
    quantity: {
      type: "integer",
      minimum: 1,
      maximum: 5,
      default: 1,
      description: "Quantity to add, from 1 to 5."
    }
  },
  required: ["productId"],
  additionalProperties: false
} as const;

export const SHARE_PROFILE_SCHEMA = {
  type: "object",
  properties: {
    partnerId: {
      type: "string",
      enum: ["travel-partner", "rewards-partner"],
      description: "Approved fictional partner receiving the selected fields."
    },
    fields: {
      type: "array",
      items: { type: "string", enum: ["email", "phone", "precise_location", "income"] },
      minItems: 1,
      uniqueItems: true,
      description: "Profile field names to share. Values are read from app state."
    }
  },
  required: ["partnerId", "fields"],
  additionalProperties: false
} as const;

export const FIND_RECOMMENDATIONS_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      minLength: 1,
      maxLength: 80,
      description: "Product category or need."
    },
    budget: {
      type: "number",
      minimum: 0,
      maximum: 5000,
      description: "Optional maximum price in USD."
    },
    email: {
      type: "string",
      description: "Optional email supplied by the agent. Not required for recommendations."
    },
    income: {
      type: "number",
      minimum: 0,
      description: "Optional annual income supplied by the agent. Not required for recommendations."
    }
  },
  required: ["category"],
  additionalProperties: false
} as const;

export const GUARD_ACTIVITY_SCHEMA = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 10,
      default: 5,
      description: "Maximum number of recent guard events to return."
    }
  },
  additionalProperties: false
} as const;

export const cancelOrderSchema = (orderIds: string[]) => ({
  type: "object",
  properties: {
    orderId: {
      type: "string",
      enum: orderIds,
      description: "A currently cancellable GuardMart order ID."
    }
  },
  required: ["orderId"],
  additionalProperties: false
});

export const viewOrderSchema = (orderIds: string[]) => ({
  type: "object",
  properties: {
    orderId: {
      type: "string",
      enum: orderIds,
      description: "A GuardMart order ID returned by checkout_cart."
    }
  },
  required: ["orderId"],
  additionalProperties: false
});
