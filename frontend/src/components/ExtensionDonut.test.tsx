import { render, screen } from "@testing-library/react";
import { ExtensionDonut } from "./ExtensionDonut";

describe("ExtensionDonut", () => {
  it("affiche une ligne de légende par tranche, « autres » traduit", () => {
    render(
      <ExtensionDonut
        otherLabel="autres"
        slices={[
          { label: "docx", count: 8 },
          { label: null, count: 2 },
        ]}
      />,
    );
    const lignes = screen.getAllByText(/\(\d+\)/).map((l) => l.textContent?.trim());
    expect(lignes).toEqual(["docx (8)", "autres (2)"]);
  });

  it("ne plante pas sans donnée", () => {
    const { container } = render(<ExtensionDonut otherLabel="autres" slices={[]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
