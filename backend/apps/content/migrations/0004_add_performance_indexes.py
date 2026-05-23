from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0003_delete_sponsor'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['display_order', '-created_at'], name='idx_project_display_created'),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['lang', 'display_order'], name='idx_project_lang_display'),
        ),
        migrations.AddIndex(
            model_name='podcast',
            index=models.Index(fields=['lang', '-published_at'], name='idx_podcast_lang_pub'),
        ),
        migrations.AddIndex(
            model_name='podcast',
            index=models.Index(fields=['platform', '-published_at'], name='idx_podcast_platform_pub'),
        ),
    ]

