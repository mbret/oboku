import { design, links } from "../design"

const BRAND_COLOR = design.palette.orangeHex
const BRAND_COLOR_DARK = design.palette.orangeDarkHex
const TEXT_COLOR = "#27272a"
const MUTED_COLOR = "#71717a"
const BACKGROUND_COLOR = "#f4f4f5"
const FOOTER_BACKGROUND_COLOR = "#f9f9f9"
const BORDER_COLOR = "#e4e4e7"

export const emailColors = {
  brand: BRAND_COLOR,
  brandDark: BRAND_COLOR_DARK,
  text: TEXT_COLOR,
  muted: MUTED_COLOR,
  background: BACKGROUND_COLOR,
  footerBackground: FOOTER_BACKGROUND_COLOR,
  border: BORDER_COLOR,
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/**
 * Renders a branded call-to-action button as table-based, inline-styled markup
 * so it survives the wide range of email clients.
 */
export const renderEmailButton = ({
  href,
  label,
}: {
  href: string
  label: string
}) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="border-radius:8px;background-color:${BRAND_COLOR};">
          <a href="${href}" class="oboku-btn" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${BRAND_COLOR};">${label}</a>
        </td>
      </tr>
    </table>`

/**
 * Renders the hidden preheader: the text email clients (Gmail, etc.) use as the
 * inbox snippet. It is visually hidden in the rendered email but read for the
 * preview, so it overrides the wordmark header that would otherwise be picked
 * up. The trailing zero-width/non-breaking sequence prevents following body
 * content from leaking into the snippet.
 */
const renderPreheader = (preheader: string) =>
  `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${escapeHtml(preheader)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>`

/**
 * Wraps email body content in the branded oboku layout: a centered card with a
 * wordmark header and a signature footer. Uses table-based markup and inline
 * styles so it renders consistently across email clients. This is the single
 * source of truth shared by the API (real delivery) and the admin preview.
 *
 * `preheader` sets the inbox preview snippet; omit it to let the client fall
 * back to the visible content.
 */
export const renderObokuEmail = ({
  bodyHtml,
  preheader,
}: {
  bodyHtml: string
  preheader?: string
}) =>
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <style>
      a.oboku-link { color: ${BRAND_COLOR_DARK}; text-decoration: underline; }
      a.oboku-link:hover { color: ${BRAND_COLOR}; }
      a.oboku-btn { transition: background-color 0.15s ease; }
      a.oboku-btn:hover { background-color: ${BRAND_COLOR_DARK} !important; }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    ${preheader ? renderPreheader(preheader) : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr>
        <td style="padding:28px 32px 20px;border-bottom:1px solid ${BORDER_COLOR};">
          <span style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${BRAND_COLOR};">oboku</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 28px;font-size:14px;line-height:1.6;color:${TEXT_COLOR};">
          <p style="margin:0;">Happy reading,</p>
          <p style="margin:4px 0 0;font-weight:600;color:${BRAND_COLOR};">The oboku team</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px;border-top:1px solid ${BORDER_COLOR};background-color:${FOOTER_BACKGROUND_COLOR};font-size:12px;line-height:1.5;color:${MUTED_COLOR};">
          <p style="margin:0;"><a href="${links.site}" class="oboku-link" style="color:${MUTED_COLOR};text-decoration:underline;">oboku</a> — your self-hosted reading companion.</p>
          <p style="margin:8px 0 0;">This is an automated message — please don't reply to this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

/**
 * Renders the "copy/paste this link" fallback paragraph shown beneath a CTA
 * button for clients that don't render the button. An optional `note` is
 * prepended (e.g. a "you can ignore this" reassurance).
 */
const renderFallbackLink = (url: string, note?: string) =>
  `<p style="margin:8px 0 0;font-size:13px;color:${MUTED_COLOR};">${note ? `${note} ` : ""}If the button doesn't work, copy and paste this link into your browser:<br /><a href="${url}" class="oboku-link" style="color:${BRAND_COLOR_DARK};text-decoration:underline;">${url}</a></p>`

/**
 * Wraps a plain-text broadcast body (as composed by an admin) in the branded
 * layout, preserving line breaks. Used for both real delivery and the preview.
 */
export const renderBroadcastEmail = ({ body }: { body: string }) =>
  renderObokuEmail({
    preheader: body.replace(/\s+/g, " ").trim().slice(0, 140),
    bodyHtml: `<p style="margin:0;">${escapeHtml(body).replace(/\n/g, "<br />")}</p>`,
  })

/**
 * The sign-up completion email, wrapping a CTA to the verification URL in the
 * branded layout.
 */
export const renderSignUpEmail = ({ url }: { url: string }) =>
  renderObokuEmail({
    preheader: "You're one step away — complete your oboku sign up.",
    bodyHtml: `<p style="margin:0 0 12px;">Welcome to <strong>oboku</strong>!</p>
          <p style="margin:0 0 4px;">You're one step away. Tap the button below to complete your sign up.</p>
          ${renderEmailButton({ href: url, label: "Complete sign up" })}
          ${renderFallbackLink(url)}`,
  })

/**
 * The magic-link sign-in email, wrapping a one-time sign-in CTA in the branded
 * layout.
 */
export const renderMagicLinkEmail = ({ url }: { url: string }) =>
  renderObokuEmail({
    preheader: "Your one-time link to sign in to oboku.",
    bodyHtml: `<p style="margin:0 0 4px;">Here's your one-time link to sign in to <strong>oboku</strong>.</p>
          ${renderEmailButton({ href: url, label: "Sign in to oboku" })}
          ${renderFallbackLink(url, "If you didn't request this, you can safely ignore this email.")}`,
  })
