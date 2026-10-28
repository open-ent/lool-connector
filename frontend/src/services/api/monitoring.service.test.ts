import { groupExtensions } from "./monitoring.service";

describe("groupExtensions", () => {
  it("garde toutes les extensions jusqu'à 5", () => {
    const data = [
      { _id: "docx", count: 9 },
      { _id: "xlsx", count: 5 },
      { _id: "odt", count: 3 },
    ];
    expect(groupExtensions(data)).toEqual([
      { label: "docx", count: 9 },
      { label: "xlsx", count: 5 },
      { label: "odt", count: 3 },
    ]);
  });

  it("regroupe au-delà de 5 les extensions suivantes en « autres »", () => {
    const data = [
      { _id: "docx", count: 9 },
      { _id: "xlsx", count: 5 },
      { _id: "odt", count: 3 },
      { _id: "pptx", count: 2 },
      { _id: "ods", count: 1 },
      { _id: "odp", count: 1 },
    ];
    expect(groupExtensions(data)).toEqual([
      { label: "docx", count: 9 },
      { label: "xlsx", count: 5 },
      { label: "odt", count: 3 },
      { label: "pptx", count: 2 },
      { label: null, count: 2 },
    ]);
  });

  it("accepte une liste vide", () => {
    expect(groupExtensions([])).toEqual([]);
  });
});
