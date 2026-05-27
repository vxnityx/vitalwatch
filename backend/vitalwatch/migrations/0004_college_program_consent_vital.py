from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("vitalwatch", "0003_alter_studentrecord_studentid"),
    ]

    operations = [
        migrations.CreateModel(
            name="College",
            fields=[
                ("college_id", models.AutoField(primary_key=True, serialize=False)),
                ("college", models.CharField(max_length=255, unique=True)),
            ],
            options={
                "db_table": "college",
            },
        ),
        migrations.CreateModel(
            name="Consent",
            fields=[
                ("consent_id", models.AutoField(primary_key=True, serialize=False)),
                ("student_id", models.CharField(db_index=True, max_length=255)),
                ("timelog", models.DateTimeField(blank=True, null=True)),
                ("consent_type", models.CharField(max_length=255)),
            ],
            options={
                "db_table": "consent",
            },
        ),
        migrations.CreateModel(
            name="Program",
            fields=[
                ("program_id", models.AutoField(primary_key=True, serialize=False)),
                ("program", models.CharField(max_length=255)),
                (
                    "college",
                    models.ForeignKey(
                        db_column="college_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="programs",
                        to="vitalwatch.college",
                    ),
                ),
            ],
            options={
                "db_table": "program",
                "unique_together": {("program", "college")},
            },
        ),
        migrations.CreateModel(
            name="Vital",
            fields=[
                ("vitals_id", models.AutoField(primary_key=True, serialize=False)),
                ("timelog", models.TimeField(blank=True, null=True)),
                ("timestamp", models.DateField(blank=True, null=True)),
                ("temperature", models.FloatField(blank=True, null=True)),
                ("heart_rate", models.IntegerField(blank=True, null=True)),
                ("systolic", models.IntegerField(blank=True, null=True)),
                ("diastolic", models.IntegerField(blank=True, null=True)),
                (
                    "consent",
                    models.ForeignKey(
                        db_column="consent_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="vitals",
                        to="vitalwatch.consent",
                    ),
                ),
                (
                    "program",
                    models.ForeignKey(
                        db_column="program_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="vitals",
                        to="vitalwatch.program",
                    ),
                ),
            ],
            options={
                "db_table": "vitals",
                "ordering": ["-timestamp", "-vitals_id"],
            },
        ),
    ]
