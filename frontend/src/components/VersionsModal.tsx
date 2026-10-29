import { Button, Modal } from "@open-ent/react";
import { useTranslation } from "react-i18next";

export interface Revision {
  _id: string;
  name: string;
  userId: string;
  userName: string;
  date: { $date: number | string };
  metadata?: { size?: number };
}

const size = (n?: number) => {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace(".", ",")} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
};
const day = (d: number | string) => {
  const date = new Date(typeof d === "number" ? d : Date.parse(String(d).replace(" ", "T")));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR");
};
/** Plus récente d'abord, comme l'ancienne page. */
export const newestFirst = (revisions: Revision[]): Revision[] => [...revisions].sort((a, b) => Number(new Date(typeof b.date.$date === "number" ? b.date.$date : String(b.date.$date))) - Number(new Date(typeof a.date.$date === "number" ? a.date.$date : String(a.date.$date))));

/** Versions du document ouvert : nom (lien de téléchargement), auteur, date, poids. */
export const VersionsModal = ({ isOpen, documentId, revisions, onClose }: { isOpen: boolean; documentId: string; revisions: Revision[]; onClose: () => void }) => {
  const { t } = useTranslation("lool");
  return (
    <Modal id="lool-versions" isOpen={isOpen} onModalClose={onClose} scrollable>
      <Modal.Header onModalClose={onClose}>{t("lool.versions.list")}</Modal.Header>
      <Modal.Body>
        <table className="table w-100" data-versions>
          <thead>
            <tr>
              <th scope="col">{t("name")}</th>
              <th scope="col">{t("user")}</th>
              <th scope="col">{t("modified")}</th>
              <th scope="col">{t("size")}</th>
            </tr>
          </thead>
          <tbody>
            {newestFirst(revisions).map((r) => (
              <tr key={r._id} data-revision={r._id}>
                <td>
                  <a href={`/workspace/document/${documentId}/revision/${r._id}`}>{r.name}</a>
                </td>
                <td>
                  <a href={`/userbook/annuaire#${r.userId}`}>{r.userName}</a>
                </td>
                <td>{day(r.date.$date)}</td>
                <td>{size(r.metadata?.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" color="tertiary" variant="ghost" onClick={onClose}>
          {t("cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
