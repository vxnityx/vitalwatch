from django.shortcuts import render

# Create your views here.

import json
import os
import secrets
import socket
import urllib.error
import urllib.parse
import urllib.request

from django.contrib.auth.hashers import check_password
from django.core import signing
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import NotificationContact
from .serializers import NotificationContactSerializer
from django.template.loader import render_to_string
from django.conf import settings
from vitalwatch.supabase_queries import fetch_joined_student_records, fetch_joined_employee_records

# We use synchronous sending here; Celery is optional and not required for delivery.


def _account_password_matches(raw_password, stored_password):
	password_format = os.getenv("ACCOUNT_PASSWORD_FORMAT", "django").strip().lower()
	if password_format == "plain":
		return secrets.compare_digest(raw_password, str(stored_password))
	return check_password(raw_password, str(stored_password))


def _account_roles(value):
	role_aliases = {
		"human-resource": "hr",
		"human resource": "hr",
		"human_resources": "hr",
		"humanresources": "hr",
		"hr": "hr",
	}

	def normalize(role):
		role = str(role).strip().lower()
		return role_aliases.get(role, role)

	if isinstance(value, list):
		return [normalize(role) for role in value if str(role).strip()]
	if isinstance(value, str):
		try:
			parsed = json.loads(value)
			if isinstance(parsed, list):
				return [normalize(role) for role in parsed if str(role).strip()]
		except json.JSONDecodeError:
			pass
		return [normalize(role) for role in value.split(",") if role.strip()]
	return []


@api_view(["POST"])
def supabase_login(request):
	email = str(request.data.get("email", "")).strip()
	password = str(request.data.get("password", ""))
	supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
	service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
	account_table = os.getenv("ACCOUNT_TABLE", "accounts")
	email_column = os.getenv("ACCOUNT_EMAIL_COLUMN", "email")
	password_column = os.getenv("ACCOUNT_PASSWORD_COLUMN", "password_hash")
	roles_column = os.getenv("ACCOUNT_ROLES_COLUMN", "role")
	id_column = os.getenv("ACCOUNT_ID_COLUMN", "account_id")

	if not email or not password:
		return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

	if not supabase_url or not service_role_key:
		return Response(
			{"detail": "Supabase authentication is not configured on the backend."},
			status=status.HTTP_503_SERVICE_UNAVAILABLE,
		)

	query = urllib.parse.urlencode({
		"select": f"{id_column},{email_column},{password_column},{roles_column}",
		email_column: f"eq.{email}",
		"limit": "1",
	})
	request_obj = urllib.request.Request(
		f"{supabase_url}/rest/v1/{urllib.parse.quote(account_table, safe='')}?{query}",
		headers={
			"apikey": service_role_key,
			"Authorization": f"Bearer {service_role_key}",
		},
		method="GET",
	)

	try:
		with urllib.request.urlopen(request_obj, timeout=10) as response:
			accounts = json.loads(response.read().decode("utf-8"))
	except urllib.error.HTTPError as exc:
		return Response(
			{"detail": "The account table could not be queried."},
			status=status.HTTP_503_SERVICE_UNAVAILABLE if exc.code >= 500 or exc.code == 404 else status.HTTP_502_BAD_GATEWAY,
		)
	except (urllib.error.URLError, socket.timeout, TimeoutError):
		return Response({"detail": "Supabase could not be reached."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

	if not isinstance(accounts, list) or not accounts:
		return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

	account = accounts[0]
	if not _account_password_matches(password, account.get(password_column, "")):
		return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

	roles = _account_roles(account.get(roles_column))
	access_token = signing.dumps(
		{"account_id": str(account.get(id_column, email)), "email": str(account.get(email_column, email)), "roles": roles},
		salt="vitalwatch-account",
	)
	return Response({
		"access_token": access_token,
		"user": {
			"id": str(account.get(id_column, email)),
			"email": str(account.get(email_column, email)),
			"roles": roles,
			"role": roles[0] if roles else "",
		},
	}, status=status.HTTP_200_OK)


class NotificationContactListCreateAPIView(generics.ListCreateAPIView):
	queryset = NotificationContact.objects.all()
	serializer_class = NotificationContactSerializer


class NotificationContactRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
	queryset = NotificationContact.objects.all()
	serializer_class = NotificationContactSerializer
    
	# Allow PUT to behave as a partial update so clients can send only the fields they want to change (e.g. email)
	def put(self, request, *args, **kwargs):
		return self.partial_update(request, *args, **kwargs)


@api_view(["POST"])
def send_notification_contact(request, pk):
	try:
		contact = NotificationContact.objects.get(pk=pk)
	except NotificationContact.DoesNotExist:
		return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
	subject = f"VitaWatch Report - {contact.get_department_display()}"
	# Build department-specific report using joined queries where applicable.
	def compute_metrics(records):
		total = len(records)
		elevated = 0
		high_hr = 0
		mood_concern = 0
		for r in records:
			try:
				temp = float(r.get('temperature') or 0)
			except Exception:
				temp = 0
			try:
				hr = int(r.get('heart_rate') or 0)
			except Exception:
				hr = 0
			try:
				sys = int(r.get('systolic') or 0)
			except Exception:
				sys = 0
			try:
				dia = int(r.get('diastolic') or 0)
			except Exception:
				dia = 0

			if temp >= 37.5 or sys >= 140 or dia >= 90 or hr >= 100:
				elevated += 1
			if hr >= 100:
				high_hr += 1
			mood = r.get('mood_level')
			if mood is not None:
				try:
					m = int(mood)
					if m in (1, 2, 3):
						mood_concern += 1
				except Exception:
					pass

		return {"total": total, "elevated": elevated, "high_hr": high_hr, "mood_concern": mood_concern}

	students_metrics = None
	employees_metrics = None
	try:
		if contact.department == 'guidance':
			students = fetch_joined_student_records()
			students_metrics = compute_metrics(students)

		elif contact.department == 'hr':
			employees = fetch_joined_employee_records()
			employees_metrics = compute_metrics(employees)

		else:  # clinic receives both
			students = fetch_joined_student_records()
			employees = fetch_joined_employee_records()
			students_metrics = compute_metrics(students)
			employees_metrics = compute_metrics(employees)

	except Exception as e:
		# If metrics generation fails, we'll still render a template with an error message.
		error_message = str(e)
	else:
		error_message = None

	context = {
		'department': contact.get_department_display(),
		'students_metrics': students_metrics,
		'employees_metrics': employees_metrics,
		'error_message': error_message,
	}

	detailed_body = render_to_string('emails/notification_report.html', context)

	# Send via Brevo API so Railway does not depend on SMTP socket connectivity.
	try:
		api_key = getattr(settings, "BREVO_API_KEY", "").strip()
		if not api_key:
			return Response(
				{"detail": "BREVO_API_KEY is not configured on the backend."},
				status=status.HTTP_503_SERVICE_UNAVAILABLE,
			)

		payload = {
			"sender": {"email": settings.DEFAULT_FROM_EMAIL},
			"to": [{"email": contact.email}],
			"subject": subject,
			"htmlContent": detailed_body,
		}
		request = urllib.request.Request(
			"https://api.brevo.com/v3/smtp/email",
			data=json.dumps(payload).encode("utf-8"),
			headers={
				"accept": "application/json",
				"api-key": api_key,
				"content-type": "application/json",
			},
			method="POST",
		)
		with urllib.request.urlopen(request, timeout=getattr(settings, "EMAIL_TIMEOUT", 10)) as response:
			response.read()

		return Response({"detail": f"Notification sent to {contact.email}"}, status=status.HTTP_200_OK)
	except (urllib.error.URLError, socket.timeout, TimeoutError) as exc:
		return Response(
			{"detail": f"Brevo API request failed: {exc}"},
			status=status.HTTP_503_SERVICE_UNAVAILABLE,
		)
	except Exception as exc:
		return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def brevo_health_check(request):
	api_key = getattr(settings, "BREVO_API_KEY", "").strip()
	if not api_key:
		return Response(
			{"ok": False, "detail": "BREVO_API_KEY is not configured on the backend."},
			status=status.HTTP_503_SERVICE_UNAVAILABLE,
		)

	request_obj = urllib.request.Request(
		"https://api.brevo.com/v3/account",
		headers={
			"accept": "application/json",
			"api-key": api_key,
		},
		method="GET",
	)

	try:
		with urllib.request.urlopen(request_obj, timeout=getattr(settings, "EMAIL_TIMEOUT", 10)) as response:
			payload = json.loads(response.read().decode("utf-8"))
		return Response(
			{
				"ok": True,
				"detail": "Brevo API is reachable.",
				"account": payload,
			},
			status=status.HTTP_200_OK,
		)
	except (urllib.error.URLError, socket.timeout, TimeoutError) as exc:
		return Response(
			{"ok": False, "detail": f"Brevo API request failed: {exc}"},
			status=status.HTTP_503_SERVICE_UNAVAILABLE,
		)
	except Exception as exc:
		return Response(
			{"ok": False, "detail": str(exc)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR,
		)
