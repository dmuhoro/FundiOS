import { UNRESPONDED_LEAD_THRESHOLD_HOURS } from "@/lib/constants";

export type WhatsAppLanguage = "en" | "sw" | "unknown";

export function buildLeadAutoReply(input: {
  garageName: string;
  name?: string | null;
  language?: WhatsAppLanguage;
  replyWithinHours?: number;
}): string {
  const isSw = input.language === "sw";
  const hours = input.replyWithinHours ?? UNRESPONDED_LEAD_THRESHOLD_HOURS;
  const displayName = input.name?.trim() ? input.name.trim() : null;

  if (isSw) {
    const greeting = displayName ? `Hujambo ${displayName}!` : "Hujambo!";
    return `${greeting} Asante kwa kuwasiliana na ${input.garageName}. Mshauri wetu atakujibu ndani ya saa ${hours}. Ili tusaidie haraka, tafadhali tuambie make, modeli na mwaka wa gari lako.`;
  }

  const greeting = displayName ? `Hi ${displayName}!` : "Hi there!";
  return `${greeting} Thanks for reaching ${input.garageName}. An advisor will reply within ${hours} hours. To help you faster, share your vehicle's make, model, and year.`;
}

export function buildWelcomeBackReply(input: {
  customerName: string;
  garageName: string;
  language?: WhatsAppLanguage;
}): string {
  const isSw = input.language === "sw";
  if (isSw) {
    return `Karibu tena, ${input.customerName}! Tumekumbuka historia ya huduma zako kwa ${input.garageName}. Mshauri wetu atakujibu bila kuchelewa. Kama kuna dharura, jibu ujumbe huu.`;
  }
  return `Welcome back, ${input.customerName}! We have your service history at ${input.garageName}. An advisor is on the way. For anything urgent, just reply here.`;
}

export function buildFollowUpReminder(input: {
  customerName: string;
  make: string;
  model: string;
  language?: WhatsAppLanguage;
}): string {
  const isSw = input.language === "sw";
  const vehicle = `${input.make} ${input.model}`.trim();

  if (isSw) {
    return `Umbukizo! ${input.customerName}, gari lako la ${vehicle} linahitaji huduma hivi karibuni. Jibu NDIYO kuweka nafasi ya kukaguliwa, au LA kuahirisha.`;
  }
  return `Reminder! ${input.customerName}, your ${vehicle} is due for service soon. Reply YES to book a slot or NO to reschedule.`;
}