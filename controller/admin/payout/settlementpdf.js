const puppeteer = require("puppeteer");

const generateSettlementPDF = async (data, res) => {
  try {
    // 1. Create an HTML template (you can style this nicely)
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 20px;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .summary {
              margin-bottom: 20px;
            }
            .total {
              font-weight: bold;
              font-size: 16px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Weekly Settlement Report</h1>
          <div class="summary">
            <p><strong>Date Range:</strong> ${data.dateRange}</p>
            <p><strong>Total Bookings:</strong> ${data.summaryMetrics.totalBookings}</p>
            <p><strong>Company Commission:</strong> ${data.summaryMetrics.companyCommission}</p>
            <p><strong>Therapist Earnings:</strong> ${data.summaryMetrics.therapistEarnings}</p>
            <p><strong>Net Payable:</strong> ${data.summaryMetrics.netPayable || 0}</p>
            <p><strong>Net Receivable:</strong> ${data.summaryMetrics.netReceivable || 0}</p>
          </div>

          <h3>Therapist Settlements</h3>
          <table>
            <thead>
              <tr>
                <th>Therapist</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
             
            </tbody>
          </table>

          <p class="total">Total Revenue Settled: ${data.totalRevenueSettled || 0}</p>
          <p class="total">Total Revenue Pending: ${data.totalRevenuePending || 0}</p>
        </body>
      </html>
    `;

    // 2. Launch puppeteer
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // 3. Load the HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 4. Generate PDF with custom page size
    const pdfBuffer = await page.pdf({
      format: "A4", // Or use custom size: width: '600px', height: '900px'
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    await browser.close();

    // 5. Send as downloadable file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=weekly_settlement.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
};

module.exports = generateSettlementPDF;
