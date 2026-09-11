import { describe, expect, it } from "vitest";
import {
  buildFollowUpReminder,
  buildLeadAutoReply,
  buildWelcomeBackReply,
} from "@/lib/whatsapp/templates";

const GARAGE = "QuickStop Auto";

describe("WhatsApp — templates", () => {
  it("builds an English lead auto-reply with the default response window", () => {
    const reply = buildLeadAutoReply({ garageName: GARAGE, name: "Nyaga" });
    expect(reply).toContain("Hi Nyaga!");
    expect(reply).toContain(GARAGE);
    expect(reply).toContain("within 2 hours");
    expect(reply).toContain("make, model, and year");
  });

  it("builds a Kiswahili lead auto-reply", () => {
    const reply = buildLeadAutoReply({ garageName: GARAGE, name: "Nyaga", language: "sw" });
    expect(reply).toContain("Hujambo Nyaga!");
    expect(reply).toContain("ndani ya saa 2");
    expect(reply).toContain(GARAGE);
  });

  it("builds a welcome-back reply for returning customers", () => {
    const en = buildWelcomeBackReply({ customerName: "Nyaga", garageName: GARAGE });
    expect(en).toContain("Welcome back, Nyaga!");
    expect(en).toContain(GARAGE);

    const sw = buildWelcomeBackReply({
      customerName: "Nyaga",
      garageName: GARAGE,
      language: "sw",
    });
    expect(sw).toContain("Karibu tena, Nyaga!");
  });

  it("builds a follow-up reminder with YES/NO call to action", () => {
    const en = buildFollowUpReminder({ customerName: "Nyaga", make: "Toyota", model: "Fielder" });
    expect(en).toContain("your Toyota Fielder is due");
    expect(en).toContain("Reply YES");

    const sw = buildFollowUpReminder({
      customerName: "Nyaga",
      make: "Toyota",
      model: "Fielder",
      language: "sw",
    });
    expect(sw).toContain("NDIYO");
  });
});