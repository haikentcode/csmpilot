from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customers'
    
    def ready(self):
        """Import signals when the app is ready"""
        import customers.signals
        from .startup_config import setup_ssl_and_env
        setup_ssl_and_env()
