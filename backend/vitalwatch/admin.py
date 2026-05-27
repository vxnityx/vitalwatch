from django.contrib import admin
from .models import StudentRecord, FacultyRecord, College, Program, Consent, Vital
# Register your models here.

admin.site.register(StudentRecord)
admin.site.register(FacultyRecord)
admin.site.register(College)
admin.site.register(Program)
admin.site.register(Consent)
admin.site.register(Vital)