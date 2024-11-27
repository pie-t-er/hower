from flask import Blueprint, request, jsonify, session
import logging
from datetime import date, time, datetime
from sqlalchemy.sql.expression import nullslast

from ..models import Task, db

task_bp = Blueprint('task', __name__)

# API route for handling tasks
@task_bp.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
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

        return jsonify([task.to_dict() for task in tasks]), 200

    elif request.method == 'POST':
        data = request.get_json()

        # Validate task content
        if not data or 'task' not in data:
            return jsonify({"error": "Invalid task data"}), 400

        content = data.get('task').strip()
        location = data.get('location')
        due_date_str = data.get('due_date')
        due_time_str = data.get('due_time')
        priority = data.get('priority')
        color = data.get('color')

        # Parse and validate the due date and time
        due_date, due_time = None, None
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD."}), 400

        if due_time_str:
            try:
                due_time = datetime.strptime(due_time_str, '%H:%M').time()
            except ValueError:
                return jsonify({"error": "Invalid due_time format. Use HH:MM."}), 400

        # Validate color (optional)
        if color and (not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]):
            return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400

        new_task = Task(
            content=content,
            location=location if location else None,
            due_date=due_date,
            due_time=due_time,
            priority=priority if priority else None,
            color=color if color else None,
            user_id=user_id  # Associate the task with the logged-in user
        )

        try:
            db.session.add(new_task)
            db.session.commit()
            return jsonify({
                "message": "Task added successfully",
                "task": new_task.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error adding task: {e}")
            return jsonify({"error": "An error occurred while adding the task."}), 500

# API route to modify or delete tasks
@task_bp.route('/api/tasks/<int:task_id>', methods=['PUT', 'PATCH', 'DELETE'])
def modify_task(task_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({"error": "Task not found"}), 404

    if request.method in ['PUT', 'PATCH']:
        data = request.get_json()

        # Update task fields if provided in the request
        if 'task' in data:
            task.content = data['task'].strip()
        if 'location' in data:
            task.location = data['location'] if data['location'] else None
        if 'due_date' in data:
            due_date_str = data['due_date']
            if due_date_str:
                try:
                    task.due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD."}), 400
            else:
                task.due_date = None
        if 'due_time' in data:
            due_time_str = data['due_time']
            if len(due_time_str) > 5:
                due_time_str = due_time_str[0:5]
            if due_time_str:
                try:
                    task.due_time = datetime.strptime(due_time_str, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": f"Invalid due_time format '{len(due_time_str)}'. Use HH:MM."}), 400
            else:
                task.due_time = None
        if 'priority' in data:
            task.priority = data['priority'] if data['priority'] else None
        if 'color' in data:
            color = data['color']
            if color and (not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]):
                return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400
            task.color = color

        try:
            db.session.commit()
            return jsonify({"message": "Task updated successfully", "task": task.to_dict()}), 200
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating task: {e}")
            return jsonify({"error": "An error occurred while updating the task."}), 500

    elif request.method == 'DELETE':
        try:
            db.session.delete(task)
            db.session.commit()
            return jsonify({"message": "Task deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting task: {e}")
            return jsonify({"error": "An error occurred while deleting the task."}), 500

'''
@task_bp.route('/api/tasks/out', methods=['GET'])
def export_tasks():
    try:
        tasks = Task.query.all()  # Fetch all tasks
        return jsonify([task.to_dict() for task in tasks])  # Return as JSON
    except Exception as e:
        logging.error(f"Error fetching tasks: {e}")
        return jsonify({"error": "An error occurred while fetching tasks."}), 500

@task_bp.route('/api/tasks/in', methods=['POST'])
def import_tasks():
    data = request.get_json()  # Get the JSON data from the request
    if not data or not isinstance(data, list):
        return jsonify({"error": "Invalid data format. Expected a list of tasks."}), 400

    tasks = []
    for item in data:
        # Extract task fields
        content = item.get('task')
        location = item.get('location')
        due_date_str = item.get('due_date')
        due_time_str = item.get('due_time')
        priority = item.get('priority')
        color = item.get('color')
        user_id = item.get('user_id')
        # Validate and parse due_date
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": f"Invalid due_date format for task '{content}'. Use YYYY-MM-DD."}), 400

        # Validate and parse due_time
        due_time = None
        if due_time_str:
            try:
                due_time = datetime.strptime(due_time_str, '%H:%M').time()
            except ValueError:
                return jsonify({"error": f"Invalid due_time format for task '{content}'. Use HH:MM."}), 400

        # Create a new Task instance
        new_task = Task(
            content=content.strip(),
            location=location if location else None,
            due_date=due_date,
            due_time=due_time,
            priority=priority if priority else None,
            color=color if color else None,
            user_id=user_id,  # Use the default user for simplicity
        )

        tasks.append(new_task)  # Add to the list of tasks

    # Add and commit to the database
    try:
        db.session.add_all(tasks)  # Add all tasks to the session
        db.session.commit()
        return jsonify({"message": f"{len(tasks)} tasks imported successfully."}), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error importing tasks: {e}")
        return jsonify({"error": "An error occurred while importing tasks."}), 500
'''
@task_bp.route('/api/tasks/date/<string:date_str>', methods=['GET'])
def get_tasks_by_date(date_str):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    tasks = Task.query.filter_by(user_id=user_id, due_date=target_date).order_by(
        Task.priority.desc(),
        nullslast(Task.due_time.asc()),
        Task.id.asc()
    ).all()
    
    return jsonify([task.to_dict() for task in tasks]), 200