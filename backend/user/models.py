from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class Roles(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email


class NotificationContact(models.Model):
    DEPARTMENT_CHOICES = [
        ("clinic", "Clinic"),
        ("hr", "HR"),
        ("guidance", "Guidance"),
    ]

    department = models.CharField(max_length=32, choices=DEPARTMENT_CHOICES, unique=True)
    email = models.EmailField(help_text="Email address to send reports to for this department")

    class Meta:
        db_table = "notification_contact"
        verbose_name = "Notification Contact"
        verbose_name_plural = "Notification Contacts"

    def __str__(self):
        return f"{self.get_department_display()}: {self.email}"

