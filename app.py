from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from datetime import datetime
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import nullslast


from models.user import User
from models.task import Task
from models.event import Event
from models.extensions import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this to a random secret key
db.init_app(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400
    new_user = User(username=data['username'], password_hash=generate_password_hash(data['password']))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == 'GET':
        tasks = Task.query.order_by(Task.priority.desc(), nullslast(Task.due_date.asc()), nullslast(Task.due_time.asc()), Task.id.asc()).all()
        return jsonify([task.to_dict() for task in tasks])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'task' not in data:
            return jsonify({"error": "Invalid task data"}), 400
        
        content = data.get('task').strip()
        location = data.get('location')
        due_date_str = data.get('due_date')
        due_time_str = data.get('due_time')
        priority = data.get('priority')
        color = data.get('color')

        # Validate and parse due_date
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD."}), 400

        # Validate and parse due_time
        due_time = None
        if due_time_str:
            try:
                due_time = datetime.strptime(due_time_str, '%H:%M').time()
            except ValueError:
                return jsonify({"error": "Invalid due_time format. Use HH:MM."}), 400

        # Optional: Validate color
        if color and (not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]):
            return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400

        new_task = Task(
            content=content,
            location=location if location else None,
            due_date=due_date,
            due_time=due_time,
            priority=priority if priority else None,
            color=color if color else None,
            user_id=session['user_id']
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

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'PATCH', 'DELETE'])
def modify_task(task_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    task = Task.query.filter_by(id=task_id, user_id=session['user_id']).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    if request.method in ['PUT', 'PATCH']:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Update fields if they exist in the request
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
            if due_time_str:
                try:
                    task.due_time = datetime.strptime(due_time_str, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid due_time format. Use HH:MM."}), 400
            else:
                task.due_time = None

        if 'priority' in data:
            task.priority = data['priority'] if data['priority'] else None
        
        if 'color' in data:
            color = data['color']
            if color:
                if not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]:
                    return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400
                task.color = color
            else:
                task.color = None

        try:
            db.session.commit()
            return jsonify({
                "message": "Task updated successfully",
                "task": task.to_dict()
            }), 200
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

if __name__ == '__main__':
    app.run(debug=True)