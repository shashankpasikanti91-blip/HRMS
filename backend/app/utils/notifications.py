"""
Owner notifications — Telegram + email.
Called fire-and-forget; never raises so registration is never blocked.
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


def _get_settings():
    from app.core.config import get_settings
    return get_settings()


# ── Telegram ──────────────────────────────────────────────────────────────────

async def send_telegram(message: str) -> None:
    """Send a plain-text / HTML message to the owner's Telegram chat."""
    settings = _get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_OWNER_CHAT_ID
    if not token or not chat_id:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
    except Exception as exc:
        logger.warning("telegram_notify_failed: %s", exc)


# ── Email ─────────────────────────────────────────────────────────────────────

async def send_owner_email(subject: str, html_body: str) -> None:
    """Send an HTML email to the owner notification address via SMTP."""
    settings = _get_settings()
    owner_email = settings.OWNER_NOTIFICATION_EMAIL
    if not owner_email or not settings.SMTP_USER:
        return
    sender = settings.SMTP_USER
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{sender}>"
        msg["To"] = owner_email
        msg.attach(MIMEText(html_body, "html"))

        def _send():
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                if settings.SMTP_TLS:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.ehlo()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.sendmail(sender, owner_email, msg.as_string())

        # Run SMTP (blocking) in thread pool so we don't block the event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send)
    except Exception as exc:
        logger.warning("email_notify_failed: %s", exc)


# ── Combined owner alert ──────────────────────────────────────────────────────

async def notify_owner_new_signup(
    *,
    email: str,
    name: str,
    provider: str,
    product_access: Optional[list] = None,
) -> None:
    """Fire-and-forget: Telegram + email when a new user signs up."""
    products = ", ".join(product_access or ["—"])
    tg_msg = (
        "🎉 <b>New SRP HRMS Signup!</b>\n\n"
        f"👤 <b>Name:</b> {name}\n"
        f"📧 <b>Email:</b> {email}\n"
        f"🔐 <b>Provider:</b> {provider}\n"
        f"📦 <b>Access:</b> {products}\n\n"
        f"👉 <a href='https://app.hrms.srpailabs.com/dashboard/admin'>View in Admin</a>"
    )
    email_html = f"""
    <html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#4f46e5;">New User Registered — SRP AI HRMS</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">{name}</td></tr>
        <tr style="background:#f8f8f8;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">{email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Provider</td><td style="padding:8px;">{provider}</td></tr>
        <tr style="background:#f8f8f8;"><td style="padding:8px;font-weight:bold;">Product Access</td><td style="padding:8px;">{products}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="https://app.hrms.srpailabs.com/dashboard/admin"
           style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
          View Admin Dashboard
        </a>
      </p>
    </body></html>
    """
    # Fire both simultaneously, never await errors
    await asyncio.gather(
        send_telegram(tg_msg),
        send_owner_email(f"New Signup: {name} ({email})", email_html),
        return_exceptions=True,
    )


async def notify_owner_google_login(
    *,
    email: str,
    name: str,
    is_new: bool,
) -> None:
    """Notify owner when someone signs in / registers via Google."""
    if not is_new:
        return  # Only notify for brand-new users
    await notify_owner_new_signup(
        email=email,
        name=name,
        provider="Google OAuth",
        product_access=["recruit"],
    )


async def notify_owner_system_event(
    *,
    title: str,
    details: list[str],
    action_url: Optional[str] = None,
) -> None:
    """Generic owner event alert sent to Telegram + email."""
    lines = "\n".join(details)
    tg_msg = f"🔔 <b>{title}</b>\n\n{lines}"
    if action_url:
        tg_msg += f"\n\n👉 <a href='{action_url}'>Open Dashboard</a>"

    email_rows = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{line}</td></tr>" for line in details
    )
    cta_html = ""
    if action_url:
        cta_html = (
            f"<p style='margin-top:16px;'><a href='{action_url}' "
            "style='background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;'>"
            "Open Dashboard</a></p>"
        )
    email_html = f"""
    <html><body style='font-family:sans-serif;max-width:640px;margin:0 auto;'>
      <h2 style='color:#0f172a;'>{title}</h2>
      <table style='width:100%;border-collapse:collapse;'>{email_rows}</table>
      {cta_html}
    </body></html>
    """

    await asyncio.gather(
        send_telegram(tg_msg),
        send_owner_email(title, email_html),
        return_exceptions=True,
    )


async def notify_owner_admin_login(
    *,
    email: str,
    role: str,
    ip_address: Optional[str],
) -> None:
    """Owner alert for privileged user logins."""
    await notify_owner_system_event(
        title="Privileged Login Detected",
        details=[
            f"Email: {email}",
            f"Role: {role}",
            f"IP: {ip_address or 'unknown'}",
        ],
        action_url="https://app.hrms.srpailabs.com/dashboard/notifications",
    )
