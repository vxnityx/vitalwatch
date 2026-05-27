from django.contrib import admin
from .models import User, Roles, NotificationContact


@admin.register(NotificationContact)
class NotificationContactAdmin(admin.ModelAdmin):
	list_display = ("department", "email")
	list_editable = ("email",)
	ordering = ("department",)

# Optionally register Roles if needed
try:
	admin.site.register(Roles)
except Exception:
	pass
