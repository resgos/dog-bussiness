import nodemailer, { type Transporter } from "nodemailer";

const FROM = process.env.EMAIL_FROM || "Лапка помощи <hello@example.com>";

let transporter: Transporter | null = null;
function getTransport(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // dev: ничего не отправляем наружу — письмо логируется в консоль.
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }
  return transporter;
}

/** Отправляет письмо. Без SMTP_HOST — пишет содержимое в консоль (dev). */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  try {
    await getTransport().sendMail({ from: FROM, to, subject, text, html });
    if (!process.env.SMTP_HOST) {
      console.log(`\n📧 [email → ${to}] ${subject}\n${text}\n`);
    }
  } catch (e) {
    console.error("sendEmail failed:", e);
  }
}
