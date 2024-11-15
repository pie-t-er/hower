from flask import Blueprint, request, jsonify, send_file, session, current_app as app
import os
from ics import Calendar, Event as IcsEvent, Todo as IcsTask
from datetime import datetime
import logging
from sqlalchemy.sql.expression import nullslast

from ..models import Event, Task, db

port_bp = Blueprint('port', __name__)

@port_bp.route('/upload', methods=['POST'])
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
                title = event.name.strip()
                location = event.location
                date = event.begin
                time = event.begin
                eTime = event.end
                eDate = event.end
                descript = event.description.strip()

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
                    color=None,
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
                content = todo.name.strip()
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

@port_bp.route('/download', methods=['GET'])
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
