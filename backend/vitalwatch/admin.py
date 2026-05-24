from django.contrib import admin
from .models import StudentRecord, FacultyRecord
# Register your models here.

admin.site.register(StudentRecord)
admin.site.register(FacultyRecord)