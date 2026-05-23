from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0006_photo_slug"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("theme", models.CharField(choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")], default="system", max_length=20)),
                ("table_density", models.CharField(choices=[("comfortable", "Comfortable"), ("compact", "Compact")], default="comfortable", max_length=20)),
                ("motion", models.CharField(choices=[("full", "Full"), ("reduced", "Reduced")], default="full", max_length=20)),
                ("sidebar_collapsed", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="ui_preferences", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "user_preferences",
            },
        ),
    ]
