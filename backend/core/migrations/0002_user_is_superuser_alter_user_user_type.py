# Generated by Django 5.0.7 on 2024-07-25 11:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_superuser',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='user',
            name='user_type',
            field=models.CharField(choices=[('school', 'School'), ('teacher', 'Teacher'), ('student', 'Student'), ('admin', 'Admin')], max_length=20),
        ),
    ]
