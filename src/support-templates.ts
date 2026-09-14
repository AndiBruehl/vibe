export type SupportTemplateKey = "acknowledgement" | "request-details" | "under-review" | "technical-update" | "safety-guidance" | "resolved" | "custom";

type SupportTemplate = { de: string; en: string; previewDe: string; previewEn: string };

export const supportTemplates: Record<SupportTemplateKey, SupportTemplate> = {
  acknowledgement: {
    de: "Eingang bestätigen", en: "Acknowledge request",
    previewDe: "Danke, dass du dem Support geschrieben hast. Bitte schildere kurz dein Anliegen. Wenn du auf eine bereits vorhandene oder abgeschlossene Angelegenheit antwortest, ist diese aus Datenschutzgründen gelöscht.",
    previewEn: "Thank you for contacting support. Please briefly describe your concern. If you reply to an existing or closed matter, it has been deleted for privacy reasons.",
  },
  "request-details": {
    de: "Weitere Informationen anfragen", en: "Request more details",
    previewDe: "Danke für deine Nachricht. Damit wir dein Anliegen prüfen können, benötigen wir noch ein paar Informationen.",
    previewEn: "Thank you for your message. To review your concern, we need a little more information.",
  },
  "under-review": {
    de: "Prüfung läuft", en: "Under review",
    previewDe: "Wir haben dein Anliegen erhalten und prüfen es aktuell sorgfältig. Danke für deine Geduld.",
    previewEn: "We received your request and are reviewing it carefully. Thank you for your patience.",
  },
  "technical-update": {
    de: "Technisches Problem", en: "Technical issue",
    previewDe: "Danke für die genaue Beschreibung. Unser Team untersucht das technische Problem und meldet sich, sobald es ein Update gibt.",
    previewEn: "Thank you for the detailed description. Our team is investigating the technical issue and will update you as soon as possible.",
  },
  "safety-guidance": {
    de: "Sicherheits- und Community-Hinweis", en: "Safety and community guidance",
    previewDe: "Danke für deinen Hinweis. Wir nehmen Sicherheits- und Community-Themen ernst und prüfen den geschilderten Sachverhalt.",
    previewEn: "Thank you for letting us know. We take safety and community matters seriously and will review the situation you described.",
  },
  resolved: {
    de: "Anliegen abschließen", en: "Close request",
    previewDe: "Danke, dass du dem Support geschrieben hast. Dein Anliegen wurde geschlossen. Das zugehörige Ticket wurde aus Datenschutzgründen gelöscht.",
    previewEn: "Thank you for contacting support. Your request has been closed. The related ticket has been deleted for privacy reasons.",
  },
  custom: { de: "Eigene Nachricht", en: "Custom message", previewDe: "Eigener Text wird unverändert gesendet.", previewEn: "Your own text will be sent as written." },
};

export function supportTemplateText(template: SupportTemplateKey, de: boolean) {
  const item = supportTemplates[template];
  return item ? (de ? item.previewDe : item.previewEn) : null;
}
