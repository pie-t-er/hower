from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, current_app as app
from werkzeug.security import generate_password_hash, check_password_hash
import os

from ..models import User, db

auth_bp = Blueprint('auth', __name__)

# Route to render the login page
@auth_bp.route('/login')
def login():
    return render_template('login.html')

# Route to render the registration page
@auth_bp.route('/register')
def register():
    return render_template('register.html')

# API login route
@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    # Check if the user exists and the password is correct
    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username  # Store username in the session
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid username or password"}), 401

# API register route
@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    existing_user = User.query.filter_by(username=data['username']).first()

    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    # Hash the password before storing it
    new_user = User(username=data['username'], password_hash=generate_password_hash(data['password']))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful"}), 201

# API logout route
@auth_bp.route('/api/logout')
def logout():
    session.clear()  # Clear all session data
    return redirect(url_for('auth.login'))