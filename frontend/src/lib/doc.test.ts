import { filterImages, imageUrl, isFromEditor, message, originOf, parseDocContext, parseEditorMessage, tokenUrl } from "./doc";

describe("contexte de la page", () => {
  it("lit le contexte posé par le serveur", () => {
    const c = parseDocContext(JSON.stringify({ documentId: "d1", accessToken: "t1", redirection: "https://c/x", server: "https://c", resync: true, durationToken: "12" }));
    expect(c).toMatchObject({ documentId: "d1", accessToken: "t1", resync: "true", durationToken: 12, docsApiConfig: "" });
  });
  it("refuse un contexte incomplet ou illisible", () => {
    expect(parseDocContext(JSON.stringify({ documentId: "d1" }))).toBeNull();
    expect(parseDocContext("pas du json")).toBeNull();
    expect(parseDocContext(null)).toBeNull();
  });
});

describe("messages de l'éditeur", () => {
  it("lit un message JSON avec identifiant, ignore le reste", () => {
    expect(parseEditorMessage('{"MessageId":"UI_Close"}')).toEqual({ MessageId: "UI_Close" });
    expect(parseEditorMessage("n'importe quoi")).toBeNull();
    expect(parseEditorMessage('{"autre":1}')).toBeNull();
    expect(parseEditorMessage({ MessageId: "x" })).toBeNull();
  });
  it("n'écoute que le cadre de l'éditeur ou son serveur", () => {
    const frame = {};
    expect(isFromEditor({ source: frame, origin: "https://x" }, frame, "")).toBe(true);
    expect(isFromEditor({ source: {}, origin: "https://c" }, frame, "https://c")).toBe(true);
    expect(isFromEditor({ source: {}, origin: "https://autre" }, frame, "https://c")).toBe(false);
    expect(isFromEditor({ source: {}, origin: "https://c" }, undefined, "")).toBe(false);
  });
  it("répond avec un identifiant et une heure", () => {
    const m = JSON.parse(message("Host_PostmessageReady"));
    expect(m.MessageId).toBe("Host_PostmessageReady");
    expect(typeof m.SendTime).toBe("string");
    expect(JSON.parse(message("Action_InsertGraphic", { filename: "a.png" })).Values).toEqual({ filename: "a.png" });
  });
  it("déduit l'origine d'un serveur", () => {
    expect(originOf("https://collabora:9980/browser/x/cool.html")).toBe("https://collabora:9980");
    expect(originOf("pas une adresse")).toBe("");
  });
});

describe("jeton et image", () => {
  it("construit les adresses", () => {
    expect(tokenUrl("d1", "t1")).toBe("/lool/wopi/documents/d1/tokens/t1");
    expect(imageUrl("https://ent", "d1", "i1", "t1", "k1")).toBe("https://ent/lool/documents/d1/image/i1?access_token=t1&token=k1");
  });
  it("ne propose que des images, filtrées par nom sans accents ni casse", () => {
    const list = [
      { _id: "1", name: "Été.png", metadata: { "content-type": "image/png" } },
      { _id: "2", name: "ete.txt", metadata: { "content-type": "text/plain" } },
      { _id: "3", name: "Hiver.jpg", metadata: { "content-type": "image/jpeg" } },
    ];
    expect(filterImages(list, "").map((e) => e._id)).toEqual(["1", "3"]);
    expect(filterImages(list, "ETE").map((e) => e._id)).toEqual(["1"]);
    expect(filterImages(list, "zzz")).toEqual([]);
  });
});
