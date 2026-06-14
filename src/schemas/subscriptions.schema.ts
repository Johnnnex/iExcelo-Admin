import * as yup from "yup";

const requireIfSet = (counterpart: string, msg: string) =>
  yup
    .number()
    .min(0)
    .default(0)
    .test("pair-check", msg, function (val) {
      const peer = (this.parent as Record<string, unknown>)[counterpart];
      if (val && val > 0 && !peer) return this.createError({ message: msg });
      if (!val && peer)
        return this.createError({ message: "Amount is required" });
      return true;
    });

const requireIdIfAmount = (amountField: string, msg: string) =>
  yup
    .string()
    .nullable()
    .default("")
    .test("id-pair-check", msg, function (val) {
      const amt = (this.parent as Record<string, unknown>)[
        amountField
      ] as number;
      if (amt && amt > 0 && !val) return this.createError({ message: msg });
      return true;
    });

export const planSchema = yup.object({
  examTypeId: yup.string().required("Exam type is required"),
  name: yup.string().required("Name is required"),
  description: yup.string().nullable().default(""),
  durationDays: yup
    .number()
    .typeError("Must be a number")
    .positive("Must be positive")
    .integer()
    .required("Duration is required"),
  sortOrder: yup.number().integer().min(0).default(0),
  stripeProductId: yup.string().nullable().default(""),
  isActive: yup.boolean().default(true),

  // NGN — Paystack
  ngnAmount: requireIfSet(
    "ngnPaystackCode",
    "Paystack plan code is required when amount is set",
  ),
  ngnPaystackCode: requireIdIfAmount(
    "ngnAmount",
    "Paystack plan code is required",
  ),

  // USD — Stripe (US/AU) AND Paystack (GH, KE, ZA)
  usdAmount: yup
    .number()
    .min(0)
    .default(0)
    .test(
      "usd-pair",
      "At least one provider ID required for USD",
      function (val) {
        if (!val) return true;
        const { usdStripePriceId, usdPaystackCode } = this.parent as Record<
          string,
          string
        >;
        if (!usdStripePriceId && !usdPaystackCode)
          return this.createError({
            message:
              "USD needs a Stripe Price ID (for US/AU) and/or Paystack Code (for GH/KE/ZA)",
          });
        return true;
      },
    ),
  usdStripePriceId: requireIdIfAmount(
    "usdAmount",
    "Stripe Price ID is required when USD amount is set (for US/AU users)",
  ),
  usdPaystackCode: yup.string().nullable().default(""),

  // GBP — Stripe only
  gbpAmount: requireIfSet(
    "gbpStripePriceId",
    "Stripe Price ID is required when GBP amount is set",
  ),
  gbpStripePriceId: requireIdIfAmount(
    "gbpAmount",
    "Stripe Price ID is required",
  ),

  // EUR — Stripe only
  eurAmount: requireIfSet(
    "eurStripePriceId",
    "Stripe Price ID is required when EUR amount is set",
  ),
  eurStripePriceId: requireIdIfAmount(
    "eurAmount",
    "Stripe Price ID is required",
  ),

  // CAD — Stripe only
  cadAmount: requireIfSet(
    "cadStripePriceId",
    "Stripe Price ID is required when CAD amount is set",
  ),
  cadStripePriceId: requireIdIfAmount(
    "cadAmount",
    "Stripe Price ID is required",
  ),

  // AUD — Stripe only
  audAmount: requireIfSet(
    "audStripePriceId",
    "Stripe Price ID is required when AUD amount is set",
  ),
  audStripePriceId: requireIdIfAmount(
    "audAmount",
    "Stripe Price ID is required",
  ),
});

export type PlanFormValues = yup.InferType<typeof planSchema>;

// ─── Plan Drawer — dynamic currency pricing ────────────────────────────────

export const priceEntrySchema = yup.object({
  currency: yup.string().required("Currency is required"),
  amount: yup
    .number()
    .typeError("Must be a number")
    .positive("Must be > 0")
    .required("Amount required"),
  stripePriceId: yup
    .string()
    .nullable()
    .default("")
    .when("currency", {
      is: (c: string) => ["USD", "GBP", "EUR", "CAD", "AUD"].includes(c),
      then: (s) => s.required("Stripe Price ID required"),
    }),
  paystackPlanCode: yup
    .string()
    .nullable()
    .default("")
    .when("currency", {
      is: (c: string) => c === "NGN",
      then: (s) => s.required("Paystack Plan Code required"),
    }),
});

export const planDrawerSchema = yup.object({
  examTypeId: yup.string().required("Exam type is required"),
  name: yup.string().required("Name is required"),
  description: yup.string().nullable().default(""),
  durationDays: yup
    .number()
    .typeError("Must be a number")
    .positive("Must be positive")
    .integer()
    .required("Duration is required"),
  sortOrder: yup
    .number()
    .typeError("Must be a number")
    .integer()
    .min(0)
    .default(0),
  stripeProductId: yup.string().nullable().default(""),
  prices: yup
    .array()
    .of(priceEntrySchema)
    .min(1, "Add at least one currency pricing")
    .required(),
});

export type PriceEntryValues = yup.InferType<typeof priceEntrySchema>;
export type PlanDrawerValues = yup.InferType<typeof planDrawerSchema>;
