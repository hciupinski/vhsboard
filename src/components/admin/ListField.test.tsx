import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ListField } from "./ListField";

afterEach(cleanup);

function Lists() {
  const [program, setProgram] = useState(["Narty", "Basen", "Narty"]);
  const [included, setIncluded] = useState(["Nocleg", "Szkolenie"]);
  const [excluded, setExcluded] = useState(["Dojazd", "Wyżywienie"]);
  return (
    <>
      <section aria-label="Program">
        <ListField label="Atrakcje" values={program} onChange={setProgram} reorderable />
      </section>
      <section aria-label="Wliczone">
        <ListField label="W cenie" values={included} onChange={setIncluded} reorderable />
      </section>
      <section aria-label="Niewliczone">
        <ListField label="Poza ceną" values={excluded} onChange={setExcluded} reorderable />
      </section>
    </>
  );
}

describe("reorderable list fields", () => {
  it("moves entries without changing values, including duplicates, and keeps lists independent", async () => {
    const user = userEvent.setup();
    render(<Lists />);
    const program = within(screen.getByRole("region", { name: "Program" }));
    await user.click(program.getByRole("button", { name: "Przesuń pozycję „Atrakcje” 2 w górę" }));
    expect(program.getByLabelText("Atrakcje 1")).toHaveValue("Basen");
    expect(program.getByLabelText("Atrakcje 2")).toHaveValue("Narty");
    expect(program.getByLabelText("Atrakcje 3")).toHaveValue("Narty");
    expect(screen.getByLabelText("W cenie 1")).toHaveValue("Nocleg");
    await user.click(screen.getByRole("button", { name: "Przesuń pozycję „W cenie” 1 w dół" }));
    expect(screen.getByLabelText("W cenie 1")).toHaveValue("Szkolenie");
    await user.click(screen.getByRole("button", { name: "Przesuń pozycję „Poza ceną” 2 w górę" }));
    expect(screen.getByLabelText("Poza ceną 1")).toHaveValue("Wyżywienie");
    expect(
      program.getByText("Pozycja „Atrakcje” przeniesiona z miejsca 2 na 1."),
    ).toBeInTheDocument();
  });

  it("does not expose controls for reordering other lists", () => {
    render(<ListField label="Akapity opisu" values={["Tekst"]} onChange={() => {}} multiline />);
    expect(screen.queryByRole("button", { name: /przeciągnij/i })).not.toBeInTheDocument();
  });

  it("disables editing and reordering for archived offers", () => {
    render(
      <ListField
        label="Atrakcje"
        values={["Narty", "Basen"]}
        onChange={() => {}}
        reorderable
        disabled
      />,
    );
    expect(screen.getByLabelText("Atrakcje 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Przeciągnij pozycję „Atrakcje” 1" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Przesuń pozycję „Atrakcje” 1 w dół" }),
    ).toBeDisabled();
  });
});
