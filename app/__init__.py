# libraries
from flask import Flask
import os
import logging

from .models import db

from .blueprints import main_bp, auth_bp, port_bp, task_bp, event_bp

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your_secret_key_here'  # Use a random secret key for sessions
    app.config['UPLOAD_FOLDER'] = 'uploads/' # folder for uploaded ics files
    # connecting the app to the database from models/extensions.py
    db.init_app(app)

    # Ensure the upload folder exists [file uploading for importing .ics files]
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
      os.makedirs(app.config['UPLOAD_FOLDER'])

    # Set up logging
    logging.basicConfig(level=logging.DEBUG)

    # initializing app context and creating the tables of the database
    with app.app_context():
      db.create_all()

    # Register Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(port_bp)
    app.register_blueprint(auth_bp)

    return app