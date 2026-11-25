/** Converts an Egyptian phone number to the international digits WhatsApp expects. */
export function toWhatsAppNumber(phone?: string | null) {
    const digits = (phone ?? "").replace(/\D/g, "");
    if (!digits) return undefined;
    if (digits.startsWith("00")) return digits.slice(2);
    if (digits.startsWith("20")) return digits;
    if (digits.startsWith("0")) return `20${digits.slice(1)}`;
    return `20${digits}`;
}

/** Link that opens a WhatsApp chat (with the customer when a number is known) and pre-fills the message. */
export function whatsAppLink(phone: string | undefined | null, text: string) {
    const number = toWhatsAppNumber(phone);
    const query = `text=${encodeURIComponent(text)}`;
    return number ? `https://wa.me/${number}?${query}` : `https://wa.me/?${query}`;
}
