/**
 * Shared HTML shell for Guapo transactional emails — brand colors + logo, compact header
 * (no marketing hero). Commerce vs admin tone controls optional closing banner.
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
  "display:inline-block;background-color:#051537;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.02em;";

const LINK_STYLE =
  "color:#051537;text-decoration:underline;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;";

export function ctaButton(href: string, label: string): string {
  return `<a href="${escapeAttr(href)}" style="${PRIMARY_BUTTON_STYLE}">${escapeHtml(label)}</a>`;
}

export function bodyLink(href: string, label: string): string {
  return `<a href="${escapeAttr(href)}" style="${LINK_STYLE}">${escapeHtml(label)}</a>`;
}

export type GuapoEmailTone = "commerce" | "admin";

export type GuapoEmailLayoutInput = {
  lang: "da" | "en";
  /** `admin`: no large closing banner (Medusa invite etc.). */
  tone?: GuapoEmailTone;
  documentTitle: string;
  preheader: string;
  /** Main heading (H1) */
  heroTitle: string;
  /** Subheading under H1 */
  heroSubtitle: string;
  /** Trusted HTML fragment (built by our templates from escaped pieces + URLs) */
  mainHtml: string;
  /** Shown in slim navy band when tone is commerce (ignored for admin if empty) */
  closingTitle: string;
  closingSubtitle?: string;
  closingBody?: string;
  footerLegal: string;
  /** Default center; order confirmation uses left for tables */
  mainAlign?: "center" | "left";
};

/**
 * Full HTML document: compact header (logo + titles), main, optional slim closing, footer.
 */
export function buildGuapoEmailDocument(input: GuapoEmailLayoutInput): string {
  const tone = input.tone ?? "commerce";
  const base = getGuapoEmailAssetBase();
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
  const mainAlign = input.mainAlign === "left" ? "left" : "center";
  const showClosing =
    tone === "commerce" &&
    (input.closingTitle.trim().length > 0 ||
      (input.closingSubtitle?.trim().length ?? 0) > 0 ||
      (input.closingBody?.trim().length ?? 0) > 0);

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
      .hero-title{font-size:22px!important;line-height:28px!important}
      .closing-title{font-size:18px!important;line-height:24px!important}
      .header-inner{padding:20px 16px 16px 16px!important}
      .footer-pad{padding:20px 16px 24px 16px!important}
      .oc-line-wrap tr td.oc-line-thumb,
      .oc-line-wrap tr td.oc-line-desc,
      .oc-line-wrap tr td.oc-line-price{
        display:block!important;width:100%!important;max-width:100%!important;
        padding-left:0!important;padding-right:0!important;text-align:left!important;
      }
      .oc-line-wrap tr td.oc-line-thumb{text-align:center!important;padding:12px 0 0 0!important;}
      .oc-line-wrap tr td.oc-line-thumb img{margin:0 auto!important;}
      .oc-line-wrap tr td.oc-line-price{padding-top:8px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eff1f5;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${pre}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#eff1f5;">
    <tr>
      <td style="padding:20px 12px;" align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;margin:0 auto;border-radius:10px;overflow:hidden;background-color:#ffffff;border:1px solid #e2e8f0;">

          <tr>
            <td class="header-inner mob-pad" style="padding:28px 28px 20px 28px;text-align:center;background-color:#ffffff;border-bottom:1px solid #e8ecf1;">
              <img src="${escapeAttr(logo)}" alt="GUAPO" width="108" style="display:inline-block;width:108px;height:auto;margin:0 0 16px 0;">
              <h1 class="hero-title" style="margin:0;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;line-height:32px;color:#051537;letter-spacing:-0.03em;">${heroTitle}</h1>
              <p style="margin:8px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#64748b;">${heroSub}</p>
            </td>
          </tr>

          <tr>
            <td class="mob-pad" style="padding:28px 28px 24px 28px;text-align:${mainAlign};background-color:#ffffff;">
              ${input.mainHtml}
            </td>
          </tr>

          ${
            showClosing
              ? `<tr>
            <td style="padding:0 24px;background-color:#ffffff;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#051537;padding:28px 28px;text-align:center;">
              <h2 class="closing-title" style="margin:0;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;line-height:28px;color:#ffffff;letter-spacing:-0.02em;">${closingTitle}</h2>
              ${
                closingSub
                  ? `<p style="margin:12px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);font-style:italic;">${closingSub}</p>`
                  : ""
              }
              ${
                closingBody
                  ? `<div style="height:14px;font-size:1px;line-height:1px;">&nbsp;</div><p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:rgba(255,255,255,0.6);">${closingBody}</p>`
                  : ""
              }
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td class="footer-pad" style="background-color:#051537;padding:20px 28px 26px 28px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <div style="height:16px;font-size:1px;line-height:1px;">&nbsp;</div>
              <a href="https://www.guapo.dk" style="font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;font-weight:500;letter-spacing:2px;color:rgba(255,255,255,0.45);text-decoration:none;text-transform:uppercase;">www.guapo.dk</a>
              <div style="height:14px;font-size:1px;line-height:1px;">&nbsp;</div>
              <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:rgba(255,255,255,0.35);">
                ${footerLegal}
              </p>
              <p style="margin:10px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:rgba(255,255,255,0.22);">
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
