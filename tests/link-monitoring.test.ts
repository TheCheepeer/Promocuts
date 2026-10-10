import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkOfferLink } from "../src/lib/monitoring/link-checker.js";

describe("Monitoramento de Links de Ofertas (checkOfferLink)", () => {
    it("deve rejeitar URLs vazias ou nulas com isAvailable = false", async () => {
        const resultEmpty = await checkOfferLink("");
        assert.equal(resultEmpty.isAvailable, false);
        assert.equal(resultEmpty.statusCode, null);

        const resultInvalid = await checkOfferLink("não-é-uma-url");
        assert.equal(resultInvalid.isAvailable, false);
    });

    it("deve bloquear requisições para endereços de rede privada e loopback", async () => {
        const resultLocal = await checkOfferLink("http://127.0.0.1:8080/oferta");
        assert.equal(resultLocal.isAvailable, false);
        assert.equal(resultLocal.statusCode, null);
        assert.ok(resultLocal.error?.includes("inválida ou restrita"));

        const resultMetadata = await checkOfferLink(
            "http://169.254.169.254/latest/meta-data/",
        );
        assert.equal(resultMetadata.isAvailable, false);
    });
});

