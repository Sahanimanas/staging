const PDFDocument = require("pdfkit");

function generateTherapistInvoice(invoiceData) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // --- Background ---
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff8dc");
  doc.fillColor("black");

  // --- Header ---
  doc
    .fontSize(14)
    .text("NOIRA HOLDINGS LIMITED", { align: "center" })
    .fontSize(10)
    .text("86-90 Paul Street, Hackney, EC2A 4NE, United Kingdom", {
      align: "center",
    })
    .text("Ph: +44 7733893650 | Email: hargun@noira.co.uk", {
      align: "center",
    })
    .moveDown();

  // --- Invoice Info ---
  doc
    .fontSize(12)
    .text(`INVOICE No.: ${invoiceData.invoiceNo || ""}`, { align: "left" })
    .text(`Date: ${invoiceData.date || new Date().toLocaleDateString()}`, {
      align: "left",
    })
    .moveDown();

  doc.text(`Bill To: ${invoiceData.therapistName || ""}`).moveDown();

  // --- Table Setup ---
  const tableTop = doc.y + 10;
  const colWidths = [100, 60, 65, 65, 65, 100, 70]; // added Settlement Status col
  const headers = [
    "Client",
    "Mode",
    "Total (£)",
    "Therapist (£)",
    "Noira (£)",
    "Settlement Note",
    "Status",
  ];
  const padding = 4;

  // --- Table Header ---
  let x = doc.page.margins.left;
  const headerHeight = 20;
  headers.forEach((header, i) => {
    const verticalOffset = (headerHeight - doc.currentLineHeight()) / 2;
    doc.fontSize(9).text(header, x + padding, tableTop + padding + verticalOffset, {
      width: colWidths[i] - 2 * padding,
      align: "center",
    });
    x += colWidths[i];
  });

  // Draw header lines
  doc
    .moveTo(doc.page.margins.left, tableTop)
    .lineTo(
      doc.page.margins.left + colWidths.reduce((a, b) => a + b, 0),
      tableTop
    )
    .stroke();
  let rowY = tableTop + headerHeight;
  doc
    .moveTo(doc.page.margins.left, rowY)
    .lineTo(
      doc.page.margins.left + colWidths.reduce((a, b) => a + b, 0),
      rowY
    )
    .stroke();

  // --- Table Rows ---
  const columnXPositions = [];
  x = doc.page.margins.left;
  colWidths.forEach((w) => {
    columnXPositions.push(x);
    x += w;
  });

  invoiceData.bookings.forEach((b) => {
    x = doc.page.margins.left;

    const clientName =
      typeof b.clientName === "object"
        ? b.clientName.name || JSON.stringify(b.clientName)
        : b.clientName;

    const row = [
      clientName || "",
      b.mode || "",
      (b.total ?? 0).toFixed(2),
      (b.therapistShare ?? 0).toFixed(2),
      (b.noiraShare ?? 0).toFixed(2),
      b.note || "",
      b.settlementStatus || "Pending",
    ];

    const cellHeights = row.map((cell, i) =>
      doc.heightOfString(String(cell), { width: colWidths[i] - 2 * padding })
    );
    const dynamicRowHeight = Math.max(...cellHeights) + 2 * padding;

    row.forEach((cell, i) => {
      const verticalOffset = (dynamicRowHeight - cellHeights[i]) / 2;
      doc.fontSize(8).text(String(cell), x + padding, rowY + padding + verticalOffset, {
        width: colWidths[i] - 2 * padding,
        align: "center",
      });
      x += colWidths[i];
    });

    rowY += dynamicRowHeight;
    doc
      .moveTo(doc.page.margins.left, rowY)
      .lineTo(
        doc.page.margins.left + colWidths.reduce((a, b) => a + b, 0),
        rowY
      )
      .stroke();
  });

  // Draw vertical lines
  columnXPositions.push(
    doc.page.margins.left + colWidths.reduce((a, b) => a + b, 0)
  );
  columnXPositions.forEach((lineX) => {
    doc.moveTo(lineX, tableTop).lineTo(lineX, rowY).stroke();
  });

  doc.moveDown(2);

  // --- Summary Section ---
  const summaryX = doc.page.margins.left;
  doc
    .fontSize(12)
    .text("Summary", summaryX, doc.y, { underline: true, align: "left" })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .text(
      `Cash with Therapist: £${(
        invoiceData.summary.cash?.total ?? 0
      ).toFixed(2)} (Therapist £${(
        invoiceData.summary.cash?.therapist ?? 0
      ).toFixed(2)}, Noira £${(invoiceData.summary.cash?.noira ?? 0).toFixed(
        2
      )})`,
      summaryX,
      doc.y,
      { align: "left" }
    )
    .moveDown(0.5)
    .text(
      `Online with Noira: £${(
        invoiceData.summary.online?.total ?? 0
      ).toFixed(2)} (Therapist £${(
        invoiceData.summary.online?.therapist ?? 0
      ).toFixed(2)}, Noira £${(
        invoiceData.summary.online?.noira ?? 0
      ).toFixed(2)})`,
      summaryX,
      doc.y,
      { align: "left" }
    )
    .moveDown(0.5)
    .text(`Net Settlement: ${invoiceData.summary.netNote || ""}`, summaryX, doc.y, {
      align: "left",
    })
    .moveDown(0.5)
    .text(
      `Overall Settlement Status: ${invoiceData.settlementStatus || "PENDING"}`,
      summaryX,
      doc.y,
      { align: "left" }
    )
    .moveDown(0.5)
    .text(
      `Pending Amount: £${(invoiceData.pendingAmount ?? 0).toString()}`,
      summaryX,
      doc.y,
      { align: "left" }
    );

  doc.moveDown(3);

  // --- Footer ---
  doc.text("Authorized Signatory", { align: "left" }).moveDown();
  doc.text("For NOIRA HOLDINGS LIMITED", { align: "left" });

  return doc;
}

module.exports = generateTherapistInvoice;
