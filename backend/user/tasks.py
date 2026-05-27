from celery import shared_task
from django.core.mail import EmailMessage, get_connection
from django.conf import settings


@shared_task(bind=True)
def send_notification_email(self, to_email: str, subject: str, body: str, from_email: str = None):
    """Send a notification email. Uses Django SMTP settings (Brevo) configured in settings."""
    from_email = from_email or settings.DEFAULT_FROM_EMAIL

    try:
        connection = get_connection(
            backend=settings.EMAIL_BACKEND,
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
        )

        msg = EmailMessage(subject=subject, body=body, from_email=from_email, to=[to_email], connection=connection)
        msg.content_subtype = "html"
        msg.send(fail_silently=False)
        return {"status": "sent", "to": to_email}
    except Exception as exc:
        # Let Celery capture the exception and retry if configured
        raise self.retry(exc=exc, countdown=60, max_retries=3)
