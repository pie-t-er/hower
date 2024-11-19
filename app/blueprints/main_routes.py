from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import nullslast
from datetime import datetime

from ..models import Event, Task

main_bp = Blueprint('main', __name__)

# Route to render the main task manager if the user is logged in
@main_bp.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', username=session['username'])

@main_bp.route('/matrix')
def matrix():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('matrix.html', username=session['username'])

@main_bp.route('/calendar')
def calendar():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('calendar.html', username=session['username'])

@main_bp.route('/api/returnAll', methods=['GET'])
def returnAll():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']

    if request.method == 'GET':
        # Fetch tasks only for the logged-in user
        tasks = Task.query.filter_by(user_id=user_id).order_by(
            Task.priority.desc(),
            nullslast(Task.due_date.asc()),
            nullslast(Task.due_time.asc()),
            Task.id.asc()
        ).all()

        events = Event.query.filter_by(user_id=user_id).order_by(
            Event.event_date.asc(),
            Event.event_time.asc(),
            Event.id.asc()
        ).all()

        # Concatenate tasks and events into a single list
        combined_list = tasks + events

        # Sort the combined list with priority consideration
        combined_list.sort(key=lambda item: (
            # First sort by date
            item.due_date if isinstance(item, Task) and item.due_date else 
            item.event_date if isinstance(item, Event) and item.event_date else 
            datetime.max.date(),
            
            # Then by time
            item.due_time if isinstance(item, Task) and item.due_time else 
            item.event_time if isinstance(item, Event) and item.event_time else 
            datetime.min.time(),
            
            # Then by priority (negative to maintain desc order, 0 for events)
            -(item.priority if isinstance(item, Task) else 5),
            
            # Finally by ID
            item.id
        ))

        
        return jsonify([item.to_dict() for item in combined_list])
