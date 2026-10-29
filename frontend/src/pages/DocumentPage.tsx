import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageCandidate, imageUrl, INSERT_GRAPHIC_REPLY, isFromEditor, message, originOf, parseDocContext, parseEditorMessage, READY_REPLY, tokenUrl } from "../lib/doc";
import { InsertImageModal } from "../components/InsertImageModal";
import { Revision, VersionsModal } from "../components/VersionsModal";

const xsrf = () => decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1] ?? "");

/**
 * Page d'ouverture d'un document dans l'éditeur en ligne (Collabora, OnlyOffice) : poste le formulaire d'accès dans un cadre plein
 * écran, répond aux messages de l'éditeur (prêt, insérer une image, versions, fermeture) et rend le jeton à la fermeture.
 * Le contexte (jeton, adresse de l'éditeur…) est posé par le serveur dans <script id="lool-doc" type="application/json">.
 */
export const DocumentPage = () => {
  const ctx = useMemo(() => parseDocContext(document.getElementById("lool-doc")?.textContent), []);
  const form = useRef<HTMLFormElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const reply = useRef<{ source: MessageEventSource | null; origin: string }>({ source: null, origin: "" });
  const closed = useRef(false);
  const [insertImage, setInsertImage] = useState(false);
  const [versions, setVersions] = useState<Revision[] | null>(null);
  const serverOrigin = ctx ? originOf(ctx.server) || originOf(ctx.redirection) : "";

  const post = useCallback((payload: string) => {
    const { source, origin } = reply.current;
    if (source && origin) (source as Window).postMessage(payload, origin);
  }, []);

  /** Rend le jeton d'accès (une seule fois), même si la page se ferme brutalement. */
  const closeToken = useCallback(() => {
    if (!ctx || closed.current) return;
    closed.current = true;
    const url = tokenUrl(ctx.documentId, ctx.accessToken);
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob());
    else void fetch(url, { method: "DELETE", credentials: "same-origin", headers: { "X-XSRF-TOKEN": xsrf() }, keepalive: true });
  }, [ctx]);

  useEffect(() => {
    if (!ctx) return;
    form.current?.submit();
    // la page de l'espace documentaire qui nous a ouverts se resynchronise
    if (window.opener && ctx.resync === "true") window.opener.postMessage(JSON.stringify({ id: "lool@resync" }), window.location.origin);
    const onMessage = (event: MessageEvent) => {
      if (!isFromEditor(event, frame.current?.contentWindow, serverOrigin)) return;
      const m = parseEditorMessage(event.data);
      if (!m) return;
      if (!reply.current.source || !reply.current.origin) reply.current = { source: event.source, origin: event.origin };
      if (m.MessageId === "App_LoadingStatus") post(message(READY_REPLY));
      else if (m.MessageId === "UI_InsertGraphic") setInsertImage(true);
      else if (m.MessageId === "UI_Close") closeToken();
      else if (m.MessageId === "UI_FileVersions")
        void fetch(`/workspace/document/${ctx.documentId}/revisions`, { credentials: "same-origin", headers: { Accept: "application/json" } })
          .then((r) => (r.ok ? r.json() : []))
          .then((list: Revision[]) => setVersions(Array.isArray(list) ? list : []))
          .catch(() => setVersions([]));
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("beforeunload", closeToken);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("beforeunload", closeToken);
    };
  }, [ctx, serverOrigin, post, closeToken]);

  const pickImage = async (img: ImageCandidate) => {
    if (!ctx) return;
    setInsertImage(false);
    try {
      const res = await fetch(`/lool/documents/${ctx.documentId}/tokens?access_token=${ctx.accessToken}&image=${img._id}`, { credentials: "same-origin", headers: { Accept: "application/json" } });
      const { _id } = (await res.json()) as { _id: string };
      post(message(INSERT_GRAPHIC_REPLY, { filename: img.name, url: imageUrl(window.location.origin, ctx.documentId, img._id, ctx.accessToken, _id) }));
    } catch {
      /* l'insertion échoue sans bloquer le document */
    }
  };

  if (!ctx) return <p role="alert">Document introuvable.</p>;
  const allow = ["sync-xhr", "autoplay", "camera", "microphone", "display-capture", "clipboard-write"].map((f) => `${f} ${ctx.server}`).join("; ");
  return (
    <>
      <form ref={form} action={ctx.redirection} method="post" target="lool-editor-frame" data-lool-form>
        <input type="hidden" name="access_token" value={ctx.accessToken} />
        <input type="hidden" name="access_token_ttl" value={String(ctx.durationToken)} />
        <input type="hidden" name="docs_api_config" value={ctx.docsApiConfig} />
      </form>
      <iframe ref={frame} name="lool-editor-frame" title={ctx.providerName} allow={allow} allowFullScreen style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }} data-lool-iframe />
      <InsertImageModal isOpen={insertImage} onClose={() => setInsertImage(false)} onPick={(i) => void pickImage(i)} />
      <VersionsModal isOpen={versions !== null} documentId={ctx.documentId} revisions={versions ?? []} onClose={() => setVersions(null)} />
    </>
  );
};
