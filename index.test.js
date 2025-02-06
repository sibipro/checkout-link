import { beforeEach } from "vitest";
import { describe, it, expect } from "vitest";
import { buildCheckoutLink, ReceivedBothFulfillmentMethodAndFulfillmentMethodId } from ".";
import { produce } from "immer";
const product = {
    shop: "ge",
    sku: "123",
};
describe("buildCheckoutLink", () => {
    describe("when called with nothing", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink();
        });
        it("should return a checkout link", () => {
            expect(result).toBe("https://checkout.sibipro.com/?v=3");
        });
    });
    describe("when called with an address", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ addressSearch: "123 Main St, Anytown, USA" });
        });
        it("should return a checkout link with the address search parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("addressSearch")).toBe("123 Main St, Anytown, USA");
        });
    });
    describe("when called with a propertyId", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ propertyId: "123" });
        });
        it("should return a checkout link with the propertyId parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("propertyId")).toBe("123");
        });
    });
    describe("when called with special instructions", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ specialInstructions: "Special instructions" });
        });
        it("should return a checkout link with the special instructions parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("specialInstructions")).toBe("Special instructions");
        });
    });
    describe("when called with a PO number", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ poNumber: "123456" });
        });
        it("should return a checkout link with the PO number parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("poNumber")).toBe("123456");
        });
    });
    describe("when called with contact information", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                contactInfo: {
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    phone: "123-456-7890",
                },
            });
        });
        it("should return a checkout link with the contact information parameters", () => {
            const url = new URL(result);
            expect(url.searchParams.get("firstName")).toBe("John");
            expect(url.searchParams.get("lastName")).toBe("Doe");
            expect(url.searchParams.get("email")).toBe("john.doe@example.com");
            expect(url.searchParams.get("phone")).toBe("123-456-7890");
        });
    });
    describe("when called with returnTo", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ returnTo: "https://sibipro.com/asdf" });
        });
        it("should return a checkout link with the returnTo parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("returnTo")).toBe("https://sibipro.com/asdf");
        });
    });
    describe("when called with source", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ source: "checkout-link-tests" });
        });
        it("should return a checkout link with the source parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("source")).toBe("checkout-link-tests");
        });
    });
    describe("when called with a product", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [product],
            });
        });
        it("should return a checkout link with the product parameters", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.sku")).toBe("123");
            expect(url.searchParams.get("1.shop")).toBe("ge");
        });
    });
    describe("when called with a different product", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.urlId = "first";
                        draft.sku = "strange-sku";
                        draft.shop = "horrors";
                    }),
                ],
            });
        });
        it("should return a checkout link with the product parameters", () => {
            const url = new URL(result);
            expect(url.searchParams.get("first.sku")).toBe("strange-sku");
            expect(url.searchParams.get("first.shop")).toBe("horrors");
        });
    });
    describe("when the product urlId has url unsafe characters", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.urlId = "first/@product";
                    }),
                ],
            });
        });
        it("should escape the urlId", () => {
            const url = new URL(result);
            expect(url.searchParams.keys()).toContain("first%2F%40product.sku");
            expect(url.searchParams.keys()).toContain("first%2F%40product.shop");
        });
    });
    describe("when called with multiple products", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.urlId = "first";
                        draft.sku = "sku1";
                        draft.shop = "shop1";
                    }),
                    produce(product, (draft) => {
                        draft.urlId = "second";
                        draft.sku = "sku2";
                        draft.shop = "shop2";
                    }),
                ],
            });
        });
        it("should return a checkout link with the product parameters", () => {
            const url = new URL(result);
            expect(url.searchParams.get("first.sku")).toBe("sku1");
            expect(url.searchParams.get("first.shop")).toBe("shop1");
            expect(url.searchParams.get("second.sku")).toBe("sku2");
            expect(url.searchParams.get("second.shop")).toBe("shop2");
        });
    });
    describe("when called without a urlId", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        delete draft.urlId;
                    }),
                    produce(product, (draft) => {
                        delete draft.urlId;
                    }),
                ],
            });
        });
        it("should set the urlIds for the searchParams to something unique for each product", () => {
            const url = new URL(result);
            const params = new Set(url.searchParams.keys());
            expect(params).toContain("1.sku");
            expect(params).toContain("1.shop");
            expect(params).toContain("2.sku");
            expect(params).toContain("2.shop");
        });
    });
    describe("when called with a product that has a distribution center id", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.distributionCenterId = "dc1";
                    }),
                ],
            });
        });
        it("should return a checkout link with the distribution center id parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.distributionCenterId")).toBe("dc1");
        });
    });
    describe("when called with a product that has a fulfillment method", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.fulfillmentMethod = "PICKUP";
                    }),
                ],
            });
        });
        it("should return a checkout link with the fulfillmentMethod parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.fulfillmentMethod")).toBe("PICKUP");
        });
    });
    describe("when called with a product that has a fulfillment method id", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.fulfillmentMethodId = "sibi-pickup";
                    }),
                ],
            });
        });
        it("should return a checkout link with the fulfillmentMethodId parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.fulfillmentMethodId")).toBe("sibi-pickup");
        });
    });
    describe("when called with a product that has a fulfillment method and a fulfillment method id", () => {
        it("should throw an error", () => {
            expect(() => {
                return buildCheckoutLink({
                    products: [{ ...product, fulfillmentMethodId: "sibi-pickup", fulfillmentMethod: "PICKUP" }],
                });
            }).toThrow(ReceivedBothFulfillmentMethodAndFulfillmentMethodId);
        });
    });
    describe("when called with a product that has a requested fulfillment date", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.requestedFulfillmentDate = "2024-12-31";
                    }),
                ],
            });
        });
        it("should return a checkout link with the requestedFulfillmentDate parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.requestedFulfillmentDate")).toBe("2024-12-31");
        });
    });
    describe("when a product has a payment method", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.paymentMethodId = "pm1";
                    }),
                ],
            });
        });
        it("should return a checkout link with the paymentMethodId parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.paymentMethodId")).toBe("pm1");
        });
    });
    describe("when a product has a quantity", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.quantity = 2;
                    }),
                ],
            });
        });
        it("should return a checkout link with the quantity parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.quantity")).toBe("2");
        });
    });
    describe("when a product has a quantity of 1", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.quantity = 1;
                    }),
                ],
            });
        });
        it("should not return a checkout link with the quantity parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.quantity")).toBeNull();
        });
    });
    describe("when a product has a unit of measure", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.unitOfMeasure = "Ozz";
                    }),
                ],
            });
        });
        it("should return a checkout link with the unitOfMeasure parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.unit")).toBe("Ozz");
        });
    });
    describe("when a product has an addon id", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.addonIds = ["addon1"];
                    }),
                ],
            });
        });
        it("should return a checkout link with the addonIds parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.getAll("1.addonId")).toEqual(["addon1"]);
        });
    });
    describe("when the product has more than one addon id", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.addonIds = ["addon1", "addon2"];
                    }),
                ],
            });
        });
        it("should return a checkout link with the addonIds parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.getAll("1.addonId")).toEqual(["addon1", "addon2"]);
        });
    });
    describe("when the product has an addon title ", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.addonTitles = ["Install", "Bear in Dishwasher"];
                    }),
                ],
            });
        });
        it("should return a checkout link with the addonTitle parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.getAll("1.addonTitle")).toEqual(["Install", "Bear in Dishwasher"]);
        });
    });
    describe("when the product has options", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.options = [{ key: "color", value: "red" }];
                    }),
                ],
            });
        });
        it("should return a checkout link with the option parameter", () => {
            const options = new Set(new URL(result).searchParams.getAll("1.option"));
            expect(options).toContain("color,red");
        });
    });
    describe("when given two products out of order", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    produce(product, (draft) => {
                        draft.urlId = "2";
                    }),
                    produce(product, (draft) => {
                        draft.urlId = "1";
                    }),
                ],
            });
        });
        it("should return a checkout link with the products in order", () => {
            const url = new URL(result);
            const keys = Array.from(url.searchParams.keys());
            expect(keys).toEqual(["1.shop", "1.sku", "2.shop", "2.sku", "v"]);
        });
    });
    describe("when a product has an offered warranty", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ products: [{ ...product, offeredWarranty: true }] });
        });
        it("should return a checkout link with the offeredWarranty parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("1.offeredWarranty")).toBe("true");
        });
    });
    describe("when called with canEdit=false", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ canEdit: false });
        });
        it("should return a checkout link with the canEdit parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("canEdit")).toBe("false");
        });
    });
    describe("when called with canEdit=true", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({ canEdit: true });
        });
        it("should return a checkout link with the canEdit parameter", () => {
            const url = new URL(result);
            expect(url.searchParams.get("canEdit")).toBeNull();
        });
    });
    describe("when called with a sparse product urlId and some products with no urlId", () => {
        let result;
        beforeEach(() => {
            result = buildCheckoutLink({
                products: [
                    { ...product, sku: "sku-1", urlId: "1" },
                    { ...product, sku: "sku-3", urlId: "3" },
                    { ...product, sku: "sku-4", urlId: undefined },
                ],
            });
        });
        it("should generate a url id for the products with no urlId that is one more than the highest urlId", () => {
            const url = new URL(result);
            expect(url.searchParams.get("4.shop")).not.toBeNull();
        });
    });
});
