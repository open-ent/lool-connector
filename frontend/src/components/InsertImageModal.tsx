import { Button, Modal } from "@open-ent/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { filterImages, ImageCandidate } from "../lib/doc";

const fetchList = async (filter: "owner" | "shared"): Promise<ImageCandidate[]> => {
  const res = await fetch(`/workspace/documents?filter=${filter}&hierarchical=false&includeall=true`, { credentials: "same-origin", headers: { Accept: "application/json" } });
  return res.ok ? ((await res.json()) as ImageCandidate[]) : [];
};

/**
 * Choix d'une image de l'espace documentaire (« Mes documents » et « Documents partagés ») à insérer dans le document ouvert.
 * Remplace la bibliothèque de médias de l'ancienne page.
 */
export const InsertImageModal = ({ isOpen, onClose, onPick }: { isOpen: boolean; onClose: () => void; onPick: (image: ImageCandidate) => void }) => {
  const { t } = useTranslation("lool");
  const [list, setList] = useState<ImageCandidate[] | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!isOpen || list) return;
    let alive = true;
    void Promise.all([fetchList("owner"), fetchList("shared")])
      .then(([mine, shared]) => alive && setList([...mine, ...shared]))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [isOpen, list]);
  const images = useMemo(() => filterImages(list ?? [], query), [list, query]);
  return (
    <Modal id="lool-insert-image" isOpen={isOpen} onModalClose={onClose} scrollable>
      <Modal.Header onModalClose={onClose}>{t("lool.insert.image.title")}</Modal.Header>
      <Modal.Body>
        <input type="search" className="form-control mb-16" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("lool.insert.image.search")} aria-label={t("lool.insert.image.search")} data-image-search />
        {list === null && <p data-image-loading>{t("lool.insert.image.loading")}</p>}
        {list !== null && images.length === 0 && <p data-image-empty>{t("lool.insert.image.empty")}</p>}
        <ul className="list-unstyled d-flex flex-wrap gap-12" data-image-list>
          {images.map((img) => (
            <li key={img._id}>
              <button type="button" className="btn btn-outline-secondary p-8" style={{ width: 140 }} onClick={() => onPick(img)} data-image-pick={img._id} title={img.name}>
                <img src={`/workspace/document/${img._id}?thumbnail=120x120`} alt="" width={120} height={120} style={{ objectFit: "cover", display: "block" }} />
                <span className="d-block text-truncate mt-4">{img.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" color="tertiary" variant="ghost" onClick={onClose}>
          {t("cancel")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
