
# libraries
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, session
import os
from ics import Calendar, Event as IcsEvent, Todo as IcsTask

from datetime import datetime
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import nullslast
from models.event import Event
from models.user import User
from models.task import Task
from models.extensions import db

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

# Route to render the main task manager if the user is logged in
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', username=session['username'])

# Route to render the login page
@app.route('/login')
def login():
    return render_template('login.html')

# Route to render the registration page
@app.route('/register')
def register():
    return render_template('register.html')

# API login route
@app.route('/api/login', methods=['POST'])
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
@app.route('/api/register', methods=['POST'])
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
@app.route('/api/logout')
def logout():
    session.clear()  # Clear all session data
    return redirect(url_for('login'))

# API route for handling tasks
@app.route('/api/tasks', methods=['GET', 'POST'])
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
@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'PATCH', 'DELETE'])
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


@app.route('/api/events', methods=['GET', 'POST'])
def handle_events():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']

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
        endDate = data.get('eDate')
        endTime = data.get('eTime')
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

        # Create a new Task instance
        new_event = Event(
            title=title,
            location=location if location else None,
            date=date,
            time=time if time else None,
            end=end if end else None,
            color=color if color else None,
            user_id=user_id
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
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    event = Event.query.filter_by(id=event_id, user_id=user_id).first()

    if not event:
        return jsonify({"error": "Event not found"}), 404
    
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

        if 'eDate' in data:
            date = data['eDate']
            if date:
                try:
                    event.end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD."}), 400
            else:
                event.end_date = None

        if 'eTime' in data:
            end = data['eTime']
            if end:
                try:
                    event.end_time = datetime.strptime(end, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid end time format. Use HH:MM."}), 400
            else:
                event.end_time = None
        
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
def ics_import():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']

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
                eTime = event.end
                eDate = event.end
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

                # Validate and parse end date
                if eDate:
                    try:
                        eDate = datetime.strptime(eDate, '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD."}), 400

                # Validate and parse end time
                if eTime:
                    try:
                        eTime = datetime.strptime(eTime, '%H:%M').time()
                    except ValueError:
                        return jsonify({"error": "Invalid end time format. Use HH:MM."}), 400

                # Create a new Task instance
                new_event = Event(
                    title=title,
                    description=descript if descript else None,
                    location=location if location else None,
                    date=date,
                    time=time if time else None,
                    end_date=eDate if eDate else None,
                    end_time=eTime if eTime else None,
                    color=color if color else None,
                    id=user_id
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

            for todo in calendar.todos:
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
                
                # Create a new Task instance
                new_task = Task(
                    content=content,
                    location=None,
                    due_date=due_date if due_date else None,
                    due_time=due_time if due_time else None,
                    priority=5,
                    color=None,
                    user_id=user_id
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


@app.route('/download', methods=['GET'])
def ics_export():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']
    calendar = Calendar()

    events = Event.query.filter_by(user_id=user_id).order_by(
            Event.event_date.asc(), 
            Event.event_time.asc(), 
            Event.id.asc()
        ).all()

    tasks = Task.query.filter_by(user_id=user_id).order_by(
            Task.priority.desc(),
            nullslast(Task.due_date.asc()),
            nullslast(Task.due_time.asc()),
            Task.id.asc()
        ).all()

    for db_task in tasks:
        task = IcsTask()
        task.name = db_task.content
        if db_task.due_date and db_task.due_time:
            task.due = datetime.combine(db_task.due_date, db_task.due_time)
        elif db_task.due_date:
                task.due = db_task.due_date
        else:
            task.due = None
        calendar.todos.add(task)

    for db_event in events:
        event = IcsEvent()
        event.name = db_event.title
        if db_event.event_date and db_event.event_time:
            event.begin = datetime.combine(db_event.event_date, db_event.event_time)
        elif db_event.event_date:
            event.begin = db_event.event_date
        if db_event.end_date and db_event.end_time:
            event.end = datetime.combine(db_event.end_date, db_event.end_time)
        elif db_event.event_date:
            event.end = db_event.end_date
        event.description = db_event.description
        calendar.events.add(event)

    exported_filepath = 'hower.ics'

    # Save the calendar to the .ics file
    with open(exported_filepath, 'w') as file:
        file.writelines(calendar.serialize())

    # Ensure the file exists before sending it
    if os.path.exists(exported_filepath):
        return send_file(
            exported_filepath,
            as_attachment=True,
            download_name='hower.ics',
            mimetype='text/calendar'  # MIME type for .ics files
        )
    else:
        return abort(404, description="File not found")

# running the app, with debugger on
if __name__ == '__main__':
    app.run(debug=True)
