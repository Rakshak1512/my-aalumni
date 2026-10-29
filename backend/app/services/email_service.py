import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional

from app.config import Config

logger = logging.getLogger('myalumni.email')


class EmailService:
    @staticmethod
    def send_smtp_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Sends an email using configured SMTP settings.
        Returns (success: bool, error_message: Optional[str]).
        Honest failure reporting - never fakes success when credentials fail or are missing.
        """
        if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
            msg = "SMTP not configured: Missing SMTP_USERNAME or SMTP_PASSWORD in backend environment."
            logger.warning(msg)
            return False, msg

        if not Config.SMTP_HOST:
            msg = "SMTP not configured: Missing SMTP_HOST."
            logger.warning(msg)
            return False, msg

        try:
            from_addr = Config.SMTP_FROM_EMAIL or Config.SMTP_USERNAME

            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"MyAlumni Portal <{from_addr}>"
            msg['To'] = to_email

            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            if Config.SMTP_PORT == 465:
                # SSL
                with smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                    server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
                    server.sendmail(from_addr, [to_email], msg.as_string())
            else:
                # TLS / STARTTLS
                with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                    if Config.SMTP_USE_TLS:
                        server.starttls()
                    server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
                    server.sendmail(from_addr, [to_email], msg.as_string())

            logger.info(f"Successfully sent email to {to_email} with subject '{subject}'")
            return True, None

        except smtplib.SMTPAuthenticationError as e:
            err = f"SMTP Authentication failed for user '{Config.SMTP_USERNAME}'. Check your app password or credentials. Error: {str(e)}"
            logger.error(err)
            return False, err
        except smtplib.SMTPConnectError as e:
            err = f"Failed to connect to SMTP host '{Config.SMTP_HOST}:{Config.SMTP_PORT}': {str(e)}"
            logger.error(err)
            return False, err
        except Exception as e:
            err = f"SMTP dispatch error: {str(e)}"
            logger.error(err, exc_info=True)
            return False, err

    @classmethod
    def send_welcome_email(cls, to_email: str, display_name: str, role: str) -> Tuple[bool, Optional[str]]:
        subject = f"Welcome to MyAlumni 2.0, {display_name}!"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
            <div style="background-color: #0a192f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">MyAlumni 2.0</h1>
                <p style="color: #14b8a6; margin: 5px 0 0; font-size: 14px;">Smart Alumni & Student Career Networking Portal</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
                <h2>Welcome, {display_name}!</h2>
                <p>Your MyAlumni account has been successfully provisioned with the role: <strong>{role.title()}</strong>.</p>
                <p>With MyAlumni 2.0, you can:</p>
                <ul>
                    <li>Connect and network with verified alumni and students</li>
                    <li>Participate in 1-on-1 career mentorship</li>
                    <li>Discover curated jobs, internships, and referral opportunities</li>
                    <li>Access academic resources and batch reunions</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{Config.FRONTEND_URL}/#/dashboard" style="background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Go to My Dashboard</a>
                </div>
                <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    This is an automated notification from MyAlumni Portal. Please do not reply directly to this email.
                </p>
            </div>
        </div>
        """
        return cls.send_smtp_email(to_email, subject, html)

    @classmethod
    def send_contact_admin_notification(cls, admin_email: str, ticket_id: str, requester_name: str, subject: str, message: str) -> Tuple[bool, Optional[str]]:
        mail_subject = f"[MyAlumni Support] New Contact Request #{ticket_id[:8]}: {subject}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <div style="background-color: #0a192f; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">New Support Ticket Received</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; background: white;">
                <p><strong>From:</strong> {requester_name}</p>
                <p><strong>Subject:</strong> {subject}</p>
                <p><strong>Message:</strong></p>
                <blockquote style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 12px; margin: 10px 0;">{message}</blockquote>
                <p><a href="{Config.FRONTEND_URL}/#/admin/tickets" style="color: #0d9488;">View Ticket in Admin Console</a></p>
            </div>
        </div>
        """
        return cls.send_smtp_email(admin_email, mail_subject, html)

    @classmethod
    def send_contact_admin_response(cls, to_email: str, ticket_subject: str, admin_reply: str) -> Tuple[bool, Optional[str]]:
        mail_subject = f"[MyAlumni Support] Update on your ticket: {ticket_subject}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <div style="background-color: #0a192f; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">Administrator Response</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; background: white;">
                <p>Your support ticket <em>"{ticket_subject}"</em> has been responded to by an administrator:</p>
                <blockquote style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0;">{admin_reply}</blockquote>
                <p><a href="{Config.FRONTEND_URL}/#/contact-admin" style="color: #0d9488;">View Ticket Status in MyAlumni</a></p>
            </div>
        </div>
        """
        return cls.send_smtp_email(to_email, mail_subject, html)


    @classmethod
    def send_otp_email(cls, to_email: str, code: str, purpose: str, expires_minutes: int = 10):
        purpose_labels = {
            "login": "sign in to MyAlumni",
            "register": "verify your MyAlumni registration",
            "reset": "reset your MyAlumni password",
        }
        action = purpose_labels.get(purpose, "verify your MyAlumni account")
        subject = f"MyAlumni verification code: {code}"
        text = (
            f"Your MyAlumni one-time verification code is {code}. "
            f"Use it to {action}. It expires in {expires_minutes} minutes. "
            "If you did not request this code, you can ignore this email."
        )
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0a192f">
          <h2>MyAlumni 2.0 verification</h2>
          <p>Use this code to {action}:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px;background:#f8fafc;text-align:center">{code}</div>
          <p>This code expires in {expires_minutes} minutes. Never share it with anyone.</p>
          <p style="color:#64748b;font-size:12px">If you did not request this code, ignore this email.</p>
        </div>
        """
        return cls.send_smtp_email(to_email, subject, html, text)
