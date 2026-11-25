/**
 * Renders the invoice to a PDF: one page as wide as the paper (`widthMm`) and as tall as the content,
 * which is what a thermal roll needs. The page is captured as an image so Arabic text looks exactly like on screen.
 */
export async function elementToPdf(element: HTMLElement, widthMm: number) {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

    // Make sure the web fonts are ready, otherwise the capture falls back to a default font
    await document.fonts?.ready;

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (doc) => {
            // The hidden copy of the invoice sits in a zero-size, clipped box: open it up for the capture
            doc.querySelectorAll<HTMLElement>("[data-invoice-offscreen]").forEach((el) => {
                el.style.position = "static";
                el.style.width = "auto";
                el.style.height = "auto";
                el.style.overflow = "visible";
            });
        },
    });

    const heightMm = (canvas.height * widthMm) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation: "portrait", compress: true });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, widthMm, heightMm);
    return pdf.output("blob");
}
