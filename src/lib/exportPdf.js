import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportScanAsPdf(elementId, filename = "scan-report.pdf") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Element not found");

  // Temporarily expand the element to capture full content
  const originalOverflow = el.style.overflow;
  el.style.overflow = "visible";

  const canvas = await html2canvas(el, {
    backgroundColor: "#080b0f",
    scale: 2, // retina quality
    useCORS: true,
    logging: false,
    windowWidth: 1200,
  });

  el.style.overflow = originalOverflow;

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add more pages if content overflows
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
