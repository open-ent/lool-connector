import { ExtensionSlice } from "../services/api/monitoring.service";

const COLORS = ["#2a9cc8", "#ff8d2e", "#46bfaf", "#8e44ad", "#9e9e9e"];
const RADIUS = 15.9155; // circonférence = 100 : un pourcentage vaut directement une longueur de trait

/** Anneau SVG sans dépendance : une tranche par extension + légende (libellé, effectif). */
export const ExtensionDonut = ({
  slices,
  otherLabel,
}: {
  slices: ExtensionSlice[];
  otherLabel: string;
}) => {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  let offset = 0;
  return (
    <div data-extension-donut className="d-flex flex-column align-items-center">
      <svg viewBox="0 0 42 42" width="100%" style={{ maxWidth: 260 }} role="img">
        {total === 0 ? (
          <circle cx="21" cy="21" r={RADIUS} fill="none" stroke="#e0e0e0" strokeWidth="6" />
        ) : (
          slices.map((s, i) => {
            const part = (s.count / total) * 100;
            const circle = (
              <circle
                key={s.label ?? "other"}
                cx="21"
                cy="21"
                r={RADIUS}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="6"
                strokeDasharray={`${part} ${100 - part}`}
                strokeDashoffset={25 - offset}
              />
            );
            offset += part;
            return circle;
          })
        )}
      </svg>
      <ul className="list-unstyled mt-12">
        {slices.map((s, i) => (
          <li key={s.label ?? "other"} data-extension-legend>
            <span
              className="d-inline-block me-8"
              style={{ width: 12, height: 12, background: COLORS[i % COLORS.length] }}
            />
            {s.label ?? otherLabel} ({s.count})
          </li>
        ))}
      </ul>
    </div>
  );
};
