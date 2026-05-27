from django.db import models

class StudentRecord(models.Model):
    College = models.CharField(max_length=255)
    Course = models.CharField(max_length=255)
    Year_Level = models.IntegerField()
    Month = models.CharField(max_length=255)
    Day = models.IntegerField()
    Year = models.IntegerField()	
    StudentID = models.CharField(max_length=255)	
    Body_Temperature_C = models.FloatField(max_length=255)
    Blood_Pressure = models.CharField(max_length=255)
    Heart_Rate_bpm = models.IntegerField()
    Emotion = models.CharField(max_length=255)

class FacultyRecord(models.Model):
    College = models.CharField(max_length=255)
    User_Type = models.CharField(max_length=255)
    Month = models.CharField(max_length=255)
    Day = models.IntegerField()
    Year = models.IntegerField()
    EmployeeID_or_Guest = models.CharField(max_length=255)
    Body_Temperature_C = models.FloatField(max_length=255)
    Blood_Pressure = models.CharField(max_length=255)
    Systolic_BP = models.IntegerField()
    Diastolic_BP = models.IntegerField()
    Heart_Rate_bpm = models.IntegerField()
    Emotion = models.CharField(max_length=255)
    Risk_Level = models.CharField(max_length=255)
    Alert_Status = models.CharField(max_length=255)


class College(models.Model):
    college_id = models.AutoField(primary_key=True)
    college = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "college"

    def __str__(self):
        return self.college


class Program(models.Model):
    program_id = models.AutoField(primary_key=True)
    program = models.CharField(max_length=255)
    college = models.ForeignKey(College, on_delete=models.CASCADE, db_column="college_id", related_name="programs")

    class Meta:
        db_table = "program"
        unique_together = ("program", "college")

    def __str__(self):
        return self.program


class Consent(models.Model):
    consent_id = models.AutoField(primary_key=True)
    student_id = models.CharField(max_length=255, db_index=True)
    timelog = models.DateTimeField(null=True, blank=True)
    consent_type = models.CharField(max_length=255)

    class Meta:
        db_table = "consent"

    def __str__(self):
        return f"{self.student_id} - {self.consent_type}"


class Vital(models.Model):
    vitals_id = models.AutoField(primary_key=True)
    consent = models.ForeignKey(Consent, on_delete=models.CASCADE, db_column="consent_id", related_name="vitals")
    timelog = models.TimeField(null=True, blank=True)
    timestamp = models.DateField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    systolic = models.IntegerField(null=True, blank=True)
    diastolic = models.IntegerField(null=True, blank=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column="program_id", related_name="vitals")

    class Meta:
        db_table = "vitals"
        ordering = ["-timestamp", "-vitals_id"]

    def __str__(self):
        return f"Vitals {self.vitals_id}"