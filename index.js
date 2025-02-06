const assert = (condition, message) => {
    if (condition)
        return;
    if (typeof message === "string")
        throw new Error(message);
    throw message;
};
export const buildCheckoutLink = ({ addressSearch, specialInstructions, poNumber, contactInfo, canEdit, returnTo, source, products, propertyId } = {}) => {
    const url = new URL(`/?v=3`, "https://checkout.sibipro.com");
    if (addressSearch)
        url.searchParams.set("addressSearch", addressSearch);
    if (specialInstructions)
        url.searchParams.set("specialInstructions", specialInstructions);
    if (poNumber)
        url.searchParams.set("poNumber", poNumber);
    if (contactInfo?.firstName)
        url.searchParams.set("firstName", contactInfo.firstName);
    if (contactInfo?.lastName)
        url.searchParams.set("lastName", contactInfo.lastName);
    if (contactInfo?.email)
        url.searchParams.set("email", contactInfo.email);
    if (contactInfo?.phone)
        url.searchParams.set("phone", contactInfo.phone);
    if (returnTo)
        url.searchParams.set("returnTo", returnTo);
    if (source)
        url.searchParams.set("source", source);
    if (propertyId)
        url.searchParams.set("propertyId", propertyId);
    if (canEdit === false)
        url.searchParams.set("canEdit", "false");
    let maxUrlId = findMaxUrlId(products?.map((product) => product.urlId) ?? []);
    products?.forEach((product) => {
        const { sku, shop, distributionCenterId, fulfillmentMethod, fulfillmentMethodId, requestedFulfillmentDate, paymentMethodId, quantity, unitOfMeasure, addonIds = [], addonTitles = [], options = [], offeredWarranty, } = product;
        let urlId = product.urlId;
        if (!urlId) {
            maxUrlId++;
            urlId = maxUrlId.toString();
        }
        const key = encodeURIComponent(urlId);
        url.searchParams.set(`${key}.sku`, sku);
        url.searchParams.set(`${key}.shop`, shop);
        assert(!(fulfillmentMethod && fulfillmentMethodId), new ReceivedBothFulfillmentMethodAndFulfillmentMethodId());
        if (distributionCenterId)
            url.searchParams.set(`${key}.distributionCenterId`, distributionCenterId);
        if (fulfillmentMethod)
            url.searchParams.set(`${key}.fulfillmentMethod`, fulfillmentMethod);
        if (fulfillmentMethodId)
            url.searchParams.set(`${key}.fulfillmentMethodId`, fulfillmentMethodId);
        if (requestedFulfillmentDate)
            url.searchParams.set(`${key}.requestedFulfillmentDate`, requestedFulfillmentDate);
        if (paymentMethodId)
            url.searchParams.set(`${key}.paymentMethodId`, paymentMethodId);
        if (quantity && quantity !== 1)
            url.searchParams.set(`${key}.quantity`, quantity.toString());
        if (unitOfMeasure)
            url.searchParams.set(`${key}.unit`, unitOfMeasure);
        if (offeredWarranty)
            url.searchParams.set(`${key}.offeredWarranty`, "true");
        addonIds.forEach((addonId) => {
            url.searchParams.append(`${key}.addonId`, addonId);
        });
        addonTitles.forEach((addonTitle) => {
            url.searchParams.append(`${key}.addonTitle`, addonTitle);
        });
        options.forEach((option) => {
            url.searchParams.append(`${key}.option`, `${option.key},${option.value}`);
        });
    });
    url.searchParams.sort();
    return url.toString();
};
const findMaxUrlId = (urlIds) => {
    return urlIds
        .map(Number)
        .filter(isNotNaN)
        .reduce((max, urlId) => Math.max(max, urlId), 0);
};
const isNotNaN = (value) => !Number.isNaN(value);
export class ReceivedBothFulfillmentMethodAndFulfillmentMethodId extends Error {
    constructor() {
        super("fulfillmentMethod and fulfillmentMethodId are mutually exclusive, received both");
    }
}
