import { describe, it, expect } from "vitest";
import { canProceed, completion, toggle, emptyPet } from "@/lib/petForm";

describe("canProceed", () => {
  it("step 0 requires a photo", () => {
    expect(canProceed(0, emptyPet)).toBe(false);
    expect(canProceed(0, { ...emptyPet, photo: "data:image/png;base64,x" })).toBe(true);
  });
  it("step 1 requires a name", () => {
    expect(canProceed(1, emptyPet)).toBe(false);
    expect(canProceed(1, { ...emptyPet, name: "Шуня" })).toBe(true);
  });
  it("step 3 requires a district", () => {
    expect(canProceed(3, emptyPet)).toBe(false);
    expect(canProceed(3, { ...emptyPet, district: "khamovniki" })).toBe(true);
  });
  it("step 5 requires a valid phone", () => {
    expect(canProceed(5, emptyPet)).toBe(false);
    expect(canProceed(5, { ...emptyPet, ownerPhone: "+79991234567" })).toBe(true);
  });
  it("optional steps (marks, temperament) always pass", () => {
    expect(canProceed(2, emptyPet)).toBe(true);
    expect(canProceed(4, emptyPet)).toBe(true);
  });
});

describe("toggle", () => {
  it("adds an absent item", () => {
    expect(toggle<string>([], "a")).toEqual(["a"]);
  });
  it("removes a present item", () => {
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("completion", () => {
  it("is 0 for an empty pet", () => {
    expect(completion(emptyPet)).toBe(0);
  });
  it("grows as fields are filled", () => {
    const partial = completion({
      ...emptyPet,
      photo: "x",
      name: "Шуня",
      district: "khamovniki",
      ownerPhone: "+79991234567",
    });
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(100);
  });
});
