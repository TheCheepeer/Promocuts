import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    isValidUuid,
    trackAffiliateClick,
} from "../src/lib/telemetry.js";

describe("Telemetria Multi-Loja - Parâmetros de Ofertas", () => {
    it("deve validar linkId opcional como UUID estrito", () => {
        const validLinkId = "b9f93943-7fef-48f8-b32b-36526eb6be21";
        const invalidLinkId = "link-invalido";

        assert.equal(isValidUuid(validLinkId), true);
        assert.equal(isValidUuid(invalidLinkId), false);
    });

    it("deve permitir disparo de trackAffiliateClick com loja e linkId sem exceções", () => {
        assert.doesNotThrow(() => {
            trackAffiliateClick(
                "c9a646d3-9c61-4cc9-bc18-472e09ff7b2b",
                "123e4567-e89b-12d3-a456-426614174000",
                "b9f93943-7fef-48f8-b32b-36526eb6be21",
                "Shopee",
            );
        });
    });

    it("deve suportar chamadas retrocompatíveis sem linkId ou storeName", () => {
        assert.doesNotThrow(() => {
            trackAffiliateClick(
                "c9a646d3-9c61-4cc9-bc18-472e09ff7b2b",
                "123e4567-e89b-12d3-a456-426614174000",
            );
        });
    });
});

