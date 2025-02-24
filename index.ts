const assert = (condition: boolean, message: string | Error) => {
  if (condition) return;
  if (typeof message === "string") throw new Error(message);
  throw message;
};

interface Props {
  /**
   * The address to search for in the checkout link. If it's an exact match, it will automatically be selected and
   * bypass the property picker. Note that there is some known weirdness about the order of property search results
   * especially when road names are not abbreviated. For example, "Court" instead of "Ct" will often cause the closest
   * result to appear at the bottom of the list of search results.
   *
   * The definition of "exact match" is based on the return value of the propertiesSearch query in GraphQL. If it returns
   * `isExactMatch: true` for one and only one property in the search results, we will consider that an exact match.
   */
  addressSearch?: string;

  /**
   * The property ID to prefill in the checkout link. If the property ID is provided, the address search will be ignored
   * as long as Checkout UI can resolve it to a property. If it cannot resolve it to a property, the address search will
   * be used to prefill the search field in the property picker.
   */
  propertyId?: string;

  /** Special instructions to prefill in the checkout link. */
  specialInstructions?: string;

  /** The PO number to prefill in the checkout link. */
  poNumber?: string;

  /**
   * The contact information to prefill in the checkout link. If omitted, the contact information will default to the
   * current user. If provided, it will automatically select "Manual Contact". If an empty object is provided, it will
   * be treated the same as omitting the contact information. All the fields are optional here because the user will
   * have the opportunity to supply missing contact information after the checkout link is created. Only the phone is
   * actually optional when using manual contact info in the checkout UI.
   */
  contactInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };

  /**
   * If false, the user will not be able to edit the order after it is placed. Defaults to true. When false, the single
   * shop checkout page will not show an "Edit Order" button and navigating to the builder will result in an automatic
   * redirect to the checkout page.
   */
  canEdit?: boolean;

  /**
   * The URL to return to after the user has placed the order. The Checkout UI will supply the Sibi order id(s) in the
   * `orderId` query parameter. When the checkout link results in multiple orders, the `orderId` query parameter will
   * be repeated, for example `orderId=123&orderId=456` so that you can get them back as an array with
   * `URLSearchParams.getAll('orderId')`.
   *
   * If omitted, the user will be redirected to the order page in web when only one order was created and an interstitial
   * page that lists the created orders and links to their corresponding pages in web when multiple orders were created.
   *
   * For security reasons, there is an allowlist of domains that the app will redirect to. If the domain supplied in
   * `returnTo` is not in the allowlist, it will be ignored by the Checkout UI. Check `sanitizeReturnTo.ts` in the
   * checkout app for the most up-to-date allowlist. Currently, it allows 'localhost', 'sibipro.com', 'sibi.sh', and
   * 'sibi.tools'.
   */
  returnTo?: string;

  /**
   * The source of the checkout link. This is useful for tracking and analytics. It will show up on the order page in
   * web & sibi.tools if the corresponding app recognizes the value. For example, both "smartjobs" and "ordering-service"
   * are recognized by sibi.tools, only "smartjobs" is recognized by web. If unrecognized by sibi.tools, it will show up
   * as "Unknown Order"
   */
  source?: string;

  /**
   * The products to include in the checkout link. If no products are provided, the checkout UI will redirect the user
   * to the builder UI, which is almost certainly not what you want. We still allow it in case you have a good reason to
   * send the user to the builder UI with some information prefilled.
   */
  products?: {
    /** If omitted, the product will be assigned a sequential number starting from 1.  */
    urlId?: string;
    sku: string;
    /** If there are products with different shops, the user will be sent to the multi-shop checkout page. */
    shop: string;
    /** If omitted, the Checkout UI will try to find the best distribution center for the property using the `bestDistributionCenterId` query. */
    distributionCenterId?: string;
    /**
     * Takes the values from the `OrderingFulfillmentMethod` enum from the GraphQL schema. Can be set to "UNSPECIFIED"
     * if you want Checkout UI to force the user to make an explicit selection instead of using the default. Is mutually
     * exclusive with `fulfillmentMethodId`, buildCheckoutLink will throw an error if both are provided.
     */
    fulfillmentMethod?: string;
    /**
     * The ID of the fulfillment method to use for this product. If omitted, the Checkout UI will use the first available
     * fulfillment method. Is mutually exclusive with `fulfillmentMethod`, buildCheckoutLink will throw an error if both
     * are provided.
     */
    fulfillmentMethodId?: string;

    /**
     * The ID of the property to ship to office. Must be provided if `fulfillmentMethodId` is set to `ship-to-office` and must
     * not be provided if `fulfillmentMethodId` is set to anything else. If an invalid combination is provided, buildCheckoutLink
     * will throw an ShippedToOfficePropertyIdAndFulfillmentMethodIdMismatch error.
     */
    shipToOfficePropertyId?: string;

    /**
     * If omitted, will default to the first available. If provided and not available, the Checkout UI will display a modal
     * telling the user that the date is not available and offer to use the first available date instead.
     */
    requestedFulfillmentDate?: string;
    /**
     * The payment method to use for this product. If omitted, the Checkout UI will default to the first available.
     */
    paymentMethodId?: string;
    /**
     * The quantity of the product to add to the cart. If omitted, defaults to 1. Must be a positive integer. If a quantity
     * of 1 is provided, it will be omitted from the checkout link since the Checkout UI will default to that anyway.
     */
    quantity?: number;
    /**
     * The unit of measure for the product. If omitted, uses the default unit of measure for the product.
     * Must be a valid unit of measure that the product supports.
     */
    unitOfMeasure?: string;
    /**
     * IDs of addons to include with this product. If omitted, no addons will be included (unless specified by `addonTitles`).
     * The user will still be able to select them during checkout. Must be valid addon IDs that are compatible with this product.
     */
    addonIds?: string[];

    /**
     * Titles of addons to include with this product. If omitted, no addons will be included (unless specified by `addonIds`).
     * The user will still be able to select them during checkout. Must be valid addon titles that are compatible with this product.
     * If both addonTitles and addonIds are provided, the addonTitles will be ignored.
     *
     * ![typical addon](https://github.com/loqwai/cdn/blob/main/bear-fridge.png?raw=true)
     */
    addonTitles?: string[];

    /**
     * This is used for options like "Color" in PPG products. The "key" maps to `optionId` and the "value" maps to
     * `partnerIdentifier`. For example, a PPG color would be specified with `{ key: "ppg-paint-color", value: "PPG1006-1" }`.
     */
    options?: { key: string; value: string }[];

    /**
     * If true, the user will not be prompted to purchase a warranty for this product even if the property
     * has requireProToPurchaseWarranty enabled.
     */
    offeredWarranty?: boolean;
  }[];
}

export const buildCheckoutLink = ({ addressSearch, specialInstructions, poNumber, contactInfo, canEdit, returnTo, source, products, propertyId }: Props = {}) => {
  const url = new URL(`/?v=3`, "https://checkout.sibipro.com");

  if (addressSearch) url.searchParams.set("addressSearch", addressSearch);
  if (specialInstructions) url.searchParams.set("specialInstructions", specialInstructions);
  if (poNumber) url.searchParams.set("poNumber", poNumber);
  if (contactInfo?.firstName) url.searchParams.set("firstName", contactInfo.firstName);
  if (contactInfo?.lastName) url.searchParams.set("lastName", contactInfo.lastName);
  if (contactInfo?.email) url.searchParams.set("email", contactInfo.email);
  if (contactInfo?.phone) url.searchParams.set("phone", contactInfo.phone);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  if (source) url.searchParams.set("source", source);
  if (propertyId) url.searchParams.set("propertyId", propertyId);
  if (canEdit === false) url.searchParams.set("canEdit", "false");

  let maxUrlId = findMaxUrlId(products?.map((product) => product.urlId) ?? []);

  products?.forEach((product) => {
    const {
      sku,
      shop,
      distributionCenterId,
      fulfillmentMethod,
      fulfillmentMethodId,
      shipToOfficePropertyId,
      requestedFulfillmentDate,
      paymentMethodId,
      quantity,
      unitOfMeasure,
      addonIds = [],
      addonTitles = [],
      options = [],
      offeredWarranty,
    } = product;

    let urlId = product.urlId;
    if (!urlId) {
      maxUrlId++;
      urlId = maxUrlId.toString();
    }

    const key = encodeURIComponent(urlId);

    url.searchParams.set(`${key}.sku`, sku);
    url.searchParams.set(`${key}.shop`, shop);

    assert(!(fulfillmentMethod && fulfillmentMethodId), new ReceivedBothFulfillmentMethodAndFulfillmentMethodId());
    assertShipToOfficePropertyIdAndFulfillmentMethodIdMatch(shipToOfficePropertyId, fulfillmentMethodId);

    if (distributionCenterId) url.searchParams.set(`${key}.distributionCenterId`, distributionCenterId);
    if (fulfillmentMethod) url.searchParams.set(`${key}.fulfillmentMethod`, fulfillmentMethod);
    if (fulfillmentMethodId) url.searchParams.set(`${key}.fulfillmentMethodId`, fulfillmentMethodId);
    if (shipToOfficePropertyId) url.searchParams.set(`${key}.shipToOfficePropertyId`, shipToOfficePropertyId);
    if (requestedFulfillmentDate) url.searchParams.set(`${key}.requestedFulfillmentDate`, requestedFulfillmentDate);
    if (paymentMethodId) url.searchParams.set(`${key}.paymentMethodId`, paymentMethodId);
    if (quantity && quantity !== 1) url.searchParams.set(`${key}.quantity`, quantity.toString());
    if (unitOfMeasure) url.searchParams.set(`${key}.unit`, unitOfMeasure);
    if (offeredWarranty) url.searchParams.set(`${key}.offeredWarranty`, "true");

    addonIds.forEach((addonId) => {
      url.searchParams.append(`${key}.addonId`, addonId);
    });

    if (addonIds.length === 0) {
      addonTitles.forEach((addonTitle) => {
        url.searchParams.append(`${key}.addonTitle`, addonTitle);
      });
    }

    options.forEach((option) => {
      url.searchParams.append(`${key}.option`, `${option.key},${option.value}`);
    });
  });

  url.searchParams.sort();

  return url.toString();
};

const findMaxUrlId = (urlIds: (string | undefined)[]) => {
  return urlIds
    .map(Number)
    .filter(isNotNaN)
    .reduce((max, urlId) => Math.max(max, urlId), 0);
};

const isNotNaN = (value: number) => !Number.isNaN(value);

const assertShipToOfficePropertyIdAndFulfillmentMethodIdMatch = (shipToOfficePropertyId: string | undefined, fulfillmentMethodId: string | undefined) => {
  if (shipToOfficePropertyId && fulfillmentMethodId !== "ship-to-office") {
    throw new ShippedToOfficePropertyIdAndFulfillmentMethodIdMismatch();
  }

  if (fulfillmentMethodId === "ship-to-office" && !shipToOfficePropertyId) {
    throw new ShippedToOfficePropertyIdAndFulfillmentMethodIdMismatch();
  }
};

export class ReceivedBothFulfillmentMethodAndFulfillmentMethodId extends Error {
  constructor() {
    super("fulfillmentMethod and fulfillmentMethodId are mutually exclusive, received both");
  }
}

export class ShippedToOfficePropertyIdAndFulfillmentMethodIdMismatch extends Error {
  constructor() {
    super("shipToOfficePropertyId must be provided if and only if fulfillmentMethodId is set to `ship-to-office`");
  }
}
