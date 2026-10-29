import { act, render } from "@testing-library/react";
import { DocumentPage } from "./DocumentPage";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("@open-ent/react", () => {
  const Modal = ({ isOpen, children }: { isOpen: boolean; children: unknown }) => (isOpen ? <div data-modal>{children as never}</div> : null);
  Modal.Header = ({ children }: { children: unknown }) => <div>{children as never}</div>;
  Modal.Body = ({ children }: { children: unknown }) => <div>{children as never}</div>;
  Modal.Footer = ({ children }: { children: unknown }) => <div>{children as never}</div>;
  return { Modal, Button: ({ children }: { children: unknown }) => <button type="button">{children as never}</button> };
});

const context = { documentId: "d1", accessToken: "t1", resync: "false", providerName: "LibreOfficeOnline", durationToken: 123, redirection: "https://collabora.example/browser/x/cool.html", server: "https://collabora.example", docsApiConfig: "" };
const put = (c: object) => {
  const s = document.createElement("script");
  s.id = "lool-doc";
  s.type = "application/json";
  s.textContent = JSON.stringify(c);
  document.body.appendChild(s);
};
const frame = () => document.querySelector("[data-lool-iframe]") as HTMLIFrameElement;
const send = (data: unknown, from: "frame" | "autre" = "frame") =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data: typeof data === "string" ? data : JSON.stringify(data), origin: "https://collabora.example", source: from === "frame" ? frame().contentWindow : window }));
  });

describe("DocumentPage", () => {
  let submit: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    document.getElementById("lool-doc")?.remove();
    submit = vi.fn();
    HTMLFormElement.prototype.submit = submit as never;
    put(context);
  });
  afterEach(() => document.getElementById("lool-doc")?.remove());

  it("poste le formulaire d'accès dans le cadre de l'éditeur", () => {
    render(<DocumentPage />);
    const form = document.querySelector("[data-lool-form]") as HTMLFormElement;
    expect(form.getAttribute("action")).toBe(context.redirection);
    expect(form.getAttribute("target")).toBe(frame().getAttribute("name"));
    expect((form.querySelector('[name="access_token"]') as HTMLInputElement).value).toBe("t1");
    expect((form.querySelector('[name="access_token_ttl"]') as HTMLInputElement).value).toBe("123");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(frame().getAttribute("allow")).toContain("camera https://collabora.example");
  });

  it("répond « prêt » quand l'éditeur signale son chargement", () => {
    render(<DocumentPage />);
    const spy = vi.spyOn(frame().contentWindow as Window, "postMessage");
    send({ MessageId: "App_LoadingStatus", Values: { Status: "Frame_Ready" } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(spy.mock.calls[0][0] as string).MessageId).toBe("Host_PostmessageReady");
  });

  it("ouvre le choix d'une image quand l'éditeur le demande", () => {
    render(<DocumentPage />);
    expect(document.querySelector("[data-modal]")).toBeNull();
    send({ MessageId: "UI_InsertGraphic" });
    expect(document.querySelector("#lool-insert-image, [data-modal]")).not.toBeNull();
  });

  it("rend le jeton une seule fois à la fermeture", () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    render(<DocumentPage />);
    send({ MessageId: "UI_Close" });
    send({ MessageId: "UI_Close" });
    window.dispatchEvent(new Event("beforeunload"));
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon).toHaveBeenCalledWith("/lool/wopi/documents/d1/tokens/t1", expect.anything());
  });

  it("ignore les messages d'une autre page", () => {
    render(<DocumentPage />);
    const spy = vi.spyOn(frame().contentWindow as Window, "postMessage");
    window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify({ MessageId: "UI_InsertGraphic" }), origin: "https://pirate.example", source: window }));
    expect(document.querySelector("[data-modal]")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("signale un contexte absent au lieu d'une page blanche", () => {
    document.getElementById("lool-doc")?.remove();
    const { container } = render(<DocumentPage />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
