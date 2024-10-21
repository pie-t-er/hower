# libraries
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
import os
from ics import Calendar
from datetime import datetime
import logging
from sqlalchemy import nullslast

# files:
from models.user import User
from models.task import Task
from models.event import Event
from models.extensions import db

# initializing the app and SQLAlchemy
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'  # Single database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads/' # folder for uploaded ics files
# connecting the app to the database from models/extensions.py
db.init_app(app)

# Ensure the upload folder exists [file uploading for importing .ics files]
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# initializing app context and creating the tables of the database
with app.app_context():
    db.create_all()
    # Check if the default user exists, creating one if not
    default_user = User.query.filter_by(username='guest').first()
    if not default_user:
        default_user = User(username='guest', password_hash='guest_password')  # Use a hash for production!
        db.session.add(default_user)
        db.session.commit()

# rendering the template from index.html
@app.route('/')
def index():
    return render_template('index.html')

# set up logging
logging.basicConfig(level=logging.DEBUG)

# API routing for GET and POST methods, see static/js/main.js for the scripts
# GET method sends list of tasks to static/js/main.js, POST method receives list of tasks from static/js/main.js
@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
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

        # Create a new Task instance with user_id set to default user
        new_task = Task(
            content=content,
            location=location if location else None,
            due_date=due_date,
            due_time=due_time,
            priority=priority if priority else None,
            color=color if color else None,
            user_id=default_user.id  # Bypass user authentication, update later!!
        )

        # Add and commit to the database
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

# these methods haven't been implemented yet in javascript, but they will be necessary for modifying task data
@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'PATCH', 'DELETE'])
def modify_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    # modifying a task
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
            priority = data['priority'] if data['priority'] else None
        
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
            return jsonify({"error": "An error occurred while updating the task."}), 500
    
    # deleting a task
    elif request.method == 'DELETE':
        try:
            db.session.delete(task)
            db.session.commit()
            return jsonify({"message": "Task deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while deleting the task."}), 500

@app.route('/api/events', methods=['GET', 'POST'])
def handle_events():
    if request.method == 'GET':
        events = Event.query.order_by(Event.event_date.asc(), Event.event_time.asc(), Event.id.asc()).all()
        return jsonify([event.to_dict() for event in events])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'event' not in data:
            return jsonify({"error": "Invalid task data"}), 400
        
        title = data.get('event').strip()
        location = data.get('location')
        date = data.get('date')
        time = data.get('time')
        end = data.get('end')
        color = data.get('color')

        # Validate and parse date
        if date:
            try:
                date = datetime.strptime(date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

        # Validate and parse time
        if time:
            try:
                time = datetime.strptime(time, '%H:%M').time()
            except ValueError:
                return jsonify({"error": "Invalid time format. Use HH:MM."}), 400

        # Validate and parse end
        if end:
            try:
                end = datetime.strptime(end, '%H:%M').time()
            except ValueError:
                return jsonify({"error": "Invalid end format. Use HH:MM."}), 400

        # Optional: Validate color
        if color and (not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]):
            return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400

        # Create a new Task instance with user_id set to default user
        new_event = Event(
            title=title,
            location=location if location else None,
            date=date,
            time=time if time else None,
            end=end if end else None,
            color=color if color else None,
            user_id=default_user.id  # Bypass user authentication, update later!!
        )

        # Add and commit to the database
        try:
            db.session.add(new_event)
            db.session.commit()
            return jsonify({
                "message": "Event added successfully",
                "event": new_event.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error adding event: {e}")
            return jsonify({"error": "An error occurred while adding the event."}), 500

# these methods haven't been implemented yet in javascript, but they will be necessary for modifying event data
@app.route('/api/events/<int:event_id>', methods=['PUT', 'PATCH', 'DELETE'])
def modify_event(event_id):
    event = Event.query.get_or_404(event_id)
    
    # modifying a task
    if request.method in ['PUT', 'PATCH']:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Update fields if they exist in the request
        if 'event' in data:
            event.content = data['event'].strip()
        
        if 'location' in data:
            task.location = data['location'] if data['location'] else None
        
        if 'date' in data:
            date = data['date']
            if date:
                try:
                    event.date = datetime.strptime(date, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
            else:
                event.date = None
        
        if 'time' in data:
            time = data['time']
            if time:
                try:
                    event.time = datetime.strptime(time, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid time format. Use HH:MM."}), 400
            else:
                event.time = None

        if 'end' in data:
            end = data['end']
            if end:
                try:
                    event.end = datetime.strptime(end, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid end format. Use HH:MM."}), 400
            else:
                event.end = None
        
        if 'color' in data:
            color = data['color']
            if color:
                if not isinstance(color, str) or not color.startswith('#') or len(color) not in [4, 7]:
                    return jsonify({"error": "Invalid color format. Use HEX codes like #FFF or #FFFFFF."}), 400
                event.color = color
            else:
                event.color = None

        try:
            db.session.commit()
            return jsonify({
                "message": "Event updated successfully",
                "event": task.to_dict()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while updating the event."}), 500
    
    # deleting a task
    elif request.method == 'DELETE':
        try:
            db.session.delete(event)
            db.session.commit()
            return jsonify({"message": "Event deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while deleting the event."}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        # Parse the uploaded .ics file
        with open(filepath, 'r') as ics_file:
            calendar = Calendar(ics_file.read())
            for event in calendar.events:
                title = event.name.strip
                location = event.location
                date = event.begin
                time = event.begin
                end = event.end
                descript = event.description.strip

                # Validate and parse date
                if date:
                    try:
                        date = datetime.strptime(date, '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

                # Validate and parse time
                if time:
                    try:
                        time = datetime.strptime(time, '%H:%M').time()
                    except ValueError:
                        return jsonify({"error": "Invalid time format. Use HH:MM."}), 400

                # Validate and parse end
                if end:
                    try:
                        end = datetime.strptime(end, '%H:%M').time()
                    except ValueError:
                        return jsonify({"error": "Invalid end format. Use HH:MM."}), 400

                # Create a new Task instance with user_id set to default user
                new_event = Event(
                    title=title,
                    description=descript if descript else None,
                    location=location if location else None,
                    date=date,
                    time=time if time else None,
                    end=end if end else None,
                    color=color if color else None,
                    user_id=default_user.id  # Bypass user authentication, update later!!
                )

                # Add and commit to the database
                try:
                    db.session.add(new_event)
                    db.session.commit()
                    return jsonify({
                        "message": "Event added successfully",
                        "event": new_event.to_dict()
                    }), 201
                except Exception as e:
                    db.session.rollback()
                    logging.error(f"Error adding event: {e}")
                    return jsonify({"error": "An error occurred while adding the event."}), 500

            for todo in calendar.todo:
                content = todo.name.strip
                due_date_str = todo.due
                due_time_str = todo.due

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
                
                # Create a new Task instance with user_id set to default user
                new_task = Task(
                    content=content,
                    location=None,
                    due_date=due_date,
                    due_time=due_time,
                    priority=5,
                    color=None,
                    user_id=default_user.id  # Bypass user authentication, update later!!
                )

                # Add and commit to the database
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
        
        return 'File uploaded and processed successfully'

# running the app, with debugger on
if __name__ == '__main__':
    app.run(debug=True)
