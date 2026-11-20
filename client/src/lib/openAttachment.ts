/**
 * Safely opens any PDF or photo in a new browser tab.
 * Handles both regular server URLs (/uploads/assignments/...) and Base64 Data URLs,
 * bypassing browser restrictions on top-level data URLs.
 */
export function openAttachmentInNewTab(url: string, title?: string) {
  if (typeof window === "undefined" || !url) return;

  if (url.startsWith("data:")) {
    const isPdf = url.startsWith("data:application/pdf") || url.includes("pdf");
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title || (isPdf ? "PDF Document" : "Photo Preview")}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background-color: #0f172a;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                overflow: hidden;
              }
              .toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 48px;
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                color: #e2e8f0;
                font-size: 13px;
                font-weight: 600;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 10;
              }
              .content-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding-top: 48px;
                box-sizing: border-box;
              }
              img {
                max-width: 94vw;
                max-height: calc(94vh - 48px);
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
              }
              iframe {
                width: 100vw;
                height: calc(100vh - 48px);
                border: none;
              }
            </style>
          </head>
          <body>
            <div class="toolbar">
              <span>${title || (isPdf ? "PDF Attachment" : "Photo Attachment")}</span>
              <a href="${url}" download="${title || "attachment"}" style="color: #6366f1; text-decoration: none; font-weight: bold; background: rgba(99, 102, 241, 0.15); padding: 6px 14px; border-radius: 6px;">Download</a>
            </div>
            <div class="content-wrapper">
              ${
                isPdf
                  ? `<iframe src="${url}"></iframe>`
                  : `<img src="${url}" alt="${title || "Attachment"}" />`
              }
            </div>
          </body>
        </html>
      `);
      win.document.close();
      return;
    }
  }

  // For regular server URLs
  window.open(url, "_blank", "noopener,noreferrer");
}
