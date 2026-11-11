/**
 * E-mails do jornal (redefinição de senha e convite para a equipe).
 * Estilos inline: os programas de e-mail ignoram <style> e CSS externo.
 */
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

type ShellInput = {
  title: string
  /** Parágrafos já escapados (podem conter <strong>). */
  paragraphs: string[]
  buttonLabel: string
  link: string
  footnote: string
}

/** Moldura comum: cabeçalho do jornal, conteúdo, botão e rodapé. */
function emailShell({ title, paragraphs, buttonLabel, link, footnote }: ShellInput) {
  const safeLink = escapeHtml(link)
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${p}</p>`)
    .join("\n      ")

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;background:#f6f6f6;">
<div style="background:#f6f6f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#121212;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e2e2;border-radius:4px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:3px solid #121212;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.15;">
        <em>Gente Querida,</em><br><strong>Gente Bacana</strong>
      </p>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;font-weight:600;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin:12px 0 28px;text-align:center;">
        <a href="${safeLink}" style="display:inline-block;background:#0b4f8a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:4px;">${escapeHtml(buttonLabel)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#5c5c5c;">${footnote}</p>
    </div>
    <div style="padding:20px 32px;background:#f6f6f6;border-top:1px solid #e2e2e2;">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#757575;">Gente Querida, Gente Bacana · Notícia de perto, contada por quem vive aqui.<br>Este é um e-mail automático; não é preciso respondê-lo.</p>
    </div>
  </div>
</div>
</body>
</html>`
}

export function passwordResetEmail({ email, link }: { email: string; link: string }) {
  const subject = "Redefina sua senha — Gente Querida, Gente Bacana"
  const html = emailShell({
    title: "Vamos criar sua nova senha",
    paragraphs: [
      `Olá! Recebemos um pedido para redefinir a senha da conta <strong>${escapeHtml(email)}</strong> no site do jornal.`,
      "Clique no botão abaixo para escolher uma senha nova:",
    ],
    buttonLabel: "Redefinir senha",
    link,
    footnote:
      "O link vale por 1 hora. Se você não pediu para trocar a senha, pode ignorar este e-mail — sua senha atual continua a mesma.",
  })
  const text = [
    "Gente Querida, Gente Bacana",
    "",
    `Recebemos um pedido para redefinir a senha da conta ${email}.`,
    "Abra o link abaixo para escolher uma senha nova (vale por 1 hora):",
    link,
    "",
    "Se você não pediu para trocar a senha, ignore este e-mail.",
  ].join("\n")
  return { subject, html, text }
}

export function teamInviteEmail({
  name,
  email,
  roleLabel,
  invitedBy,
  link,
}: {
  name: string
  email: string
  roleLabel: string
  invitedBy: string
  link: string
}) {
  const firstName = name.trim().split(/\s+/)[0] || ""
  const subject = "Você foi convidado para a equipe — Gente Querida, Gente Bacana"
  const html = emailShell({
    title: `Bem-vindo à equipe${firstName ? `, ${escapeHtml(firstName)}` : ""}!`,
    paragraphs: [
      `<strong>${escapeHtml(invitedBy)}</strong> cadastrou você no painel do jornal como <strong>${escapeHtml(roleLabel)}</strong>.`,
      `Para começar, crie a sua senha. Depois é só entrar no site com o e-mail <strong>${escapeHtml(email)}</strong>.`,
    ],
    buttonLabel: "Criar minha senha",
    link,
    footnote:
      "O link vale por 1 hora. Se ele expirar, use “Esqueci minha senha” na tela de login. Se você não esperava este convite, pode ignorar este e-mail.",
  })
  const text = [
    "Gente Querida, Gente Bacana",
    "",
    `${invitedBy} cadastrou você no painel do jornal como ${roleLabel}.`,
    `Crie a sua senha pelo link abaixo (vale por 1 hora) e depois entre com o e-mail ${email}:`,
    link,
  ].join("\n")
  return { subject, html, text }
}
