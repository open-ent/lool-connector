import { odeServices } from "@open-ent/client";

export interface OpenedDocument {
  _id: string;
  filename: string;
  users: number;
}

export interface ExtensionCount {
  _id: string;
  count: number;
}

export interface ExtensionSlice {
  /** Extension, ou `null` pour la tranche « autres » (libellé traduit par l'appelant) */
  label: string | null;
  count: number;
}

/** Nombre de tranches nommées avant de regrouper le reste en « autres » (comme l'ancien graphique). */
const NAMED_SLICES = 4;

/**
 * Au plus 5 tranches : les 4 premières extensions, le reste regroupé en « autres ».
 * Ex. [docx 9, xlsx 5, odt 3, pptx 2, ods 1, odp 1] → docx, xlsx, odt, pptx, autres (2).
 */
export const groupExtensions = (data: ExtensionCount[]): ExtensionSlice[] => {
  if (data.length <= NAMED_SLICES + 1) {
    return data.map((e) => ({ label: e._id, count: e.count }));
  }
  const named = data
    .slice(0, NAMED_SLICES)
    .map((e) => ({ label: e._id, count: e.count }));
  const other = data
    .slice(NAMED_SLICES)
    .reduce((total, e) => total + e.count, 0);
  return [...named, { label: null, count: other }];
};

export const monitoringService = {
  getDocuments: () =>
    odeServices.http().get<OpenedDocument[]>("/lool/monitoring/documents"),
  getUserCount: () =>
    odeServices
      .http()
      .get<{ count: number }>("/lool/monitoring/users/count")
      .then((r) => r.count),
  getEventCount: (event: "ACCESS" | "NEW_VERSION") =>
    odeServices
      .http()
      .get<{ count: number }>(`/lool/monitoring/events/${event}/count`)
      .then((r) => r.count),
  getExtensions: () =>
    odeServices.http().get<ExtensionCount[]>("/lool/monitoring/extensions"),
};
