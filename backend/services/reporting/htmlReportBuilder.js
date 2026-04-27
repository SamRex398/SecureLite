function buildHtmlReport(scan) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>VScanner Report - ${scan.target}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #1f2937; }
      h1, h2 { margin-bottom: 0.4rem; }
      .muted { color: #6b7280; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
      ul { padding-left: 20px; }
    </style>
  </head>
  <body>
    <h1>VScanner Report</h1>
    <p class="muted">${scan.target} (${scan.scanMode})</p>
    <div class="card">
      <h2>Summary</h2>
      <p>${scan.summary || "No summary available."}</p>
    </div>
    <div class="card">
      <h2>Findings</h2>
      <ul>
        ${(scan.findings || [])
          .map((finding) => `<li><strong>${finding.title}</strong> - ${finding.severity}</li>`)
          .join("")}
      </ul>
    </div>
  </body>
</html>`;
}

module.exports = {
  buildHtmlReport,
};
