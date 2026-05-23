from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_asset_tag_alter_post_options_alter_post_content_html_and_more"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Sponsor",
        ),
    ]

