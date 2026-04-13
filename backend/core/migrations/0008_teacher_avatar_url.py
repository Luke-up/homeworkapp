from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_remove_student_lexicon_storage'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='avatar_url',
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
