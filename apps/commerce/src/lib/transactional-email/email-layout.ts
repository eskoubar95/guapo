/**
 * Shared HTML shell for Guapo transactional emails — matches newsletter visual system
 * (Inter/Lexend, #eff1f5 / #051537, hero image + logo from public newsletter assets).
 */

const DEFAULT_ASSET_BASE =
  "https://tknxlzoejhauuzloezfi.supabase.co/storage/v1/object/public/newsletter";

export function getGuapoEmailAssetBase(): string {
  const raw = process.env.GUAPO_EMAIL_ASSET_BASE?.trim();
  const base = raw && raw.length > 0 ? raw.replace(/\/$/, "") : DEFAULT_ASSET_BASE;
  return base;
}

/** Safe for HTML text nodes */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Safe for double-quoted HTML attributes (e.g. href) */
export function escapeAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const PRIMARY_BUTTON_STYLE =
  "display:inline-block;background-color:#051537;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.02em;";

const LINK_STYLE =
  "color:#051537;text-decoration:underline;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;";

export function ctaButton(href: string, label: string): string {
  return `<a href="${escapeAttr(href)}" style="${PRIMARY_BUTTON_STYLE}">${escapeHtml(label)}</a>`;
}

export function bodyLink(href: string, label: string): string {
  return `<a href="${escapeAttr(href)}" style="${LINK_STYLE}">${escapeHtml(label)}</a>`;
}

export type GuapoEmailLayoutInput = {
  lang: "da" | "en";
  documentTitle: string;
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Trusted HTML fragment (built by our templates from escaped pieces + URLs) */
  mainHtml: string;
  closingTitle: string;
  closingSubtitle?: string;
  closingBody?: string;
  footerLegal: string;
};

/**
 * Full HTML document: outer table, hero (background + logo), main content, navy closing, footer.
 */
export function buildGuapoEmailDocument(input: GuapoEmailLayoutInput): string {
  const base = getGuapoEmailAssetBase();
  const heroBg = `${base}/hero-background.png`;
  const logo = `${base}/guapo-logo.svg`;
  const langAttr = input.lang;
  const pre = escapeHtml(input.preheader);
  const heroTitle = escapeHtml(input.heroTitle);
  const heroSub = escapeHtml(input.heroSubtitle);
  const closingTitle = escapeHtml(input.closingTitle).replace(/\n/g, "<br>");
  const closingSub = input.closingSubtitle ? escapeHtml(input.closingSubtitle) : "";
  const closingBody = input.closingBody ? escapeHtml(input.closingBody) : "";
  const footerLegal = escapeHtml(input.footerLegal).replace(/\n/g, "<br>");
  const docTitle = escapeHtml(input.documentTitle);

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${langAttr}" xml:lang="${langAttr}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${docTitle}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;width:100%!important;height:100%!important}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important}
      .mob-pad{padding-left:16px!important;padding-right:16px!important}
      .hero-title{font-size:26px!important;line-height:34px!important}
      .closing-title{font-size:24px!important;line-height:30px!important}
      .header-pad{padding:24px 20px!important}
      .footer-pad{padding:28px 20px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eff1f5;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${pre}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#eff1f5;">
    <tr>
      <td style="padding:24px 16px;" align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;margin:0 auto;border-radius:12px;overflow:hidden;background-color:#ffffff;">

          <tr>
            <td style="padding:0;text-align:center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:380px;">
              <v:fill type="frame" src="${escapeAttr(heroBg)}" color="#f5e0e4"/>
              <v:textbox inset="0,0,0,0">
              <![endif]-->
              <div style="background:url('${escapeAttr(heroBg)}') center top / cover no-repeat #f5e0e4;max-width:600px;margin:0 auto;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
                  <tr>
                    <td style="padding:30px 40px 0 40px;text-align:center;">
                      <img src="${escapeAttr(logo)}" alt="GUAPO" width="130" style="display:inline-block;width:130px;height:auto;">
                    </td>
                  </tr>
                  <tr>
                    <td class="mob-pad" style="padding:22px 36px 4px 36px;text-align:center;">
                      <h1 class="hero-title" style="margin:0;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:32px;font-weight:800;line-height:40px;color:#051537;letter-spacing:-0.03em;">${heroTitle}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 44px 0 44px;text-align:center;">
                      <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a5568;">${heroSub}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="height:120px;font-size:1px;line-height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </div>
              <!--[if gte mso 9]>
              </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <tr>
            <td class="mob-pad" style="padding:36px 48px 28px 48px;text-align:center;background-color:#ffffff;">
              ${input.mainHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:0 44px;background-color:#ffffff;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:2px solid #051537;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#051537;padding:44px 40px;text-align:center;">
              <h2 class="closing-title" style="margin:0;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;line-height:34px;color:#ffffff;letter-spacing:-0.02em;">${closingTitle}</h2>
              ${
                closingSub
                  ? `<p style="margin:18px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:rgba(255,255,255,0.7);font-style:italic;">${closingSub}</p>`
                  : ""
              }
              ${
                closingBody
                  ? `<div style="height:20px;font-size:1px;line-height:1px;">&nbsp;</div><p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:24px;color:rgba(255,255,255,0.55);">${closingBody}</p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td class="footer-pad" style="background-color:#051537;padding:0 40px 32px 40px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <div style="height:20px;font-size:1px;line-height:1px;">&nbsp;</div>
              <a href="https://www.guapo.dk" style="font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;font-weight:500;letter-spacing:2px;color:rgba(255,255,255,0.4);text-decoration:none;text-transform:uppercase;">www.guapo.dk</a>
              <div style="height:16px;font-size:1px;line-height:1px;">&nbsp;</div>
              <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:rgba(255,255,255,0.3);">
                ${footerLegal}
              </p>
              <p style="margin:10px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:rgba(255,255,255,0.2);">
                &copy; 2026 Guapo ApS &middot; CVR: 45285191
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
