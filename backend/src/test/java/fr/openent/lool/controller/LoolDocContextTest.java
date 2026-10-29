package fr.openent.lool.controller;

import io.vertx.core.json.JsonObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/** Contexte de la page d'ouverture d'un document : lisible par le front, et sans « < » qui pourrait refermer la balise qui le porte. */
public class LoolDocContextTest {

    private static JsonObject params() {
        return new JsonObject()
                .put("document-id", "d1")
                .put("access-token", "t1")
                .put("resync", true)
                .put("provider-name", "LibreOfficeOnline")
                .put("duration-token", 1793300000000L)
                .put("redirection", "https://collabora.example/browser/abc/cool.html?WOPISrc=x")
                .put("server", "https://collabora.example")
                .put("docs-api-config", "");
    }

    @Test
    public void exposesTheKeysTheFrontReads() {
        final JsonObject c = new JsonObject(LoolController.docContextJson(params()));
        assertEquals("d1", c.getString("documentId"));
        assertEquals("t1", c.getString("accessToken"));
        assertEquals("true", c.getString("resync"));
        assertEquals("LibreOfficeOnline", c.getString("providerName"));
        assertEquals(1793300000000L, c.getLong("durationToken").longValue());
        assertEquals("https://collabora.example/browser/abc/cool.html?WOPISrc=x", c.getString("redirection"));
        assertEquals("https://collabora.example", c.getString("server"));
    }

    @Test
    public void neverContainsAnOpeningAngleBracket() {
        final String json = LoolController.docContextJson(params().put("docs-api-config", "{\"title\":\"</script><b>\"}"));
        assertFalse(json.contains("<"));
        assertTrue(json.contains("\\u003c"));
        // le contenu reste intact une fois relu
        assertEquals("{\"title\":\"</script><b>\"}", new JsonObject(json).getString("docsApiConfig"));
    }
}
