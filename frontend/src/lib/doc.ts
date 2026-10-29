/** Contexte de la page d'ouverture d'un document, posé par le serveur dans <script id="lool-doc" type="application/json">. */
export interface DocContext {
  documentId: string;
  accessToken: string;
  /** « true » quand la page a été ouverte depuis l'espace documentaire, qui doit se resynchroniser à la fermeture. */
  resync: string;
  providerName: string;
  durationToken: number;
  /** Adresse de l'éditeur (Collabora, OnlyOffice) où le formulaire est posté. */
  redirection: string;
  /** Serveur de l'éditeur : origine des messages qu'il envoie, et sites auxquels le cadre a droit (son, caméra…). */
  server: string;
  /** Réglages de l'éditeur OnlyOffice (JSON), vide pour Collabora. */
  docsApiConfig: string;
}

export const parseDocContext = (raw: string | null | undefined): DocContext | null => {
  try {
    const c = JSON.parse(raw ?? "") as Partial<DocContext>;
    if (!c.documentId || !c.accessToken || !c.redirection) return null;
    return {
      documentId: c.documentId,
      accessToken: c.accessToken,
      resync: String(c.resync ?? "false"),
      providerName: c.providerName ?? "",
      durationToken: Number(c.durationToken ?? 0),
      redirection: c.redirection,
      server: c.server ?? "",
      docsApiConfig: c.docsApiConfig ?? "",
    };
  } catch {
    return null;
  }
};

/** Message de l'éditeur : `{ MessageId, Values }`, en texte JSON. Tout ce qui n'a pas cette forme est ignoré. */
export interface EditorMessage {
  MessageId: string;
  SendTime?: string;
  Values?: unknown;
}

export const parseEditorMessage = (data: unknown): EditorMessage | null => {
  if (typeof data !== "string") return null;
  try {
    const m = JSON.parse(data) as EditorMessage;
    return m && typeof m.MessageId === "string" ? m : null;
  } catch {
    return null;
  }
};

/** Origine d'un serveur (« https://collabora:9980/x » → « https://collabora:9980 »), vide si l'adresse n'est pas valide. */
export const originOf = (url: string): string => {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

/**
 * Un message n'est écouté que s'il vient du cadre de l'éditeur ou du serveur de l'éditeur : une autre page ne doit pas pouvoir
 * déclencher l'insertion d'une image ni la fermeture du jeton.
 */
export const isFromEditor = (event: { source: unknown; origin: string }, frame: unknown, serverOrigin: string): boolean =>
  (!!frame && event.source === frame) || (!!serverOrigin && event.origin === serverOrigin);

export const READY_REPLY = "Host_PostmessageReady";
export const INSERT_GRAPHIC_REPLY = "Action_InsertGraphic";

export const message = (id: string, values?: unknown) => JSON.stringify({ MessageId: id, SendTime: Date.now().toString(), ...(values === undefined ? {} : { Values: values }) });

/** Adresse du jeton à rendre à la fermeture. */
export const tokenUrl = (documentId: string, accessToken: string) => `/lool/wopi/documents/${documentId}/tokens/${accessToken}`;

/** Adresse de l'image insérée dans le document : lisible avec le jeton d'accès et le jeton propre à cette image. */
export const imageUrl = (origin: string, documentId: string, imageId: string, accessToken: string, imageToken: string) =>
  `${origin}/lool/documents/${documentId}/image/${imageId}?access_token=${accessToken}&token=${imageToken}`;

export interface ImageCandidate {
  _id: string;
  name: string;
  metadata?: { "content-type"?: string };
}

/** Images (de n'importe quel format d'image) dont le nom contient la recherche, sans tenir compte des accents ni de la casse. */
export const filterImages = <T extends ImageCandidate>(list: T[], query: string): T[] => {
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = fold(query.trim());
  return list.filter((e) => String(e.metadata?.["content-type"] ?? "").startsWith("image/") && (!q || fold(e.name).includes(q)));
};
