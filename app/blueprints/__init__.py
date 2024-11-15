from .main_routes import main_bp
from .auth_routes import auth_bp
from .port_routes import port_bp
from .event_routes import event_bp
from .task_routes import task_bp

# Expose the blueprints to be easily imported
__all__ = ['main_bp', 'auth_bp', 'port_bp', 'event_bp', 'task_bp']