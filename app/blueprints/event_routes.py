from flask import Blueprint, request, jsonify, session
import logging
from datetime import datetime

from ..models import Event, db

event_bp = Blueprint('event', __name__)

@event_bp.route('/api/events', methods=['GET', 'POST'])
def handle_events():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']

    if request.method == 'GET':
        events = Event.query.filter_by(user_id=user_id).order_by(Event.event_date.asc(), Event.event_time.asc(), Event.id.asc()).all()
        return jsonify([event.to_dict() for event in events])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'event' not in data:
            return jsonify({"error": "Invalid event data"}), 400
        
        print('Received data:', data)
        
        title = data.get('event').strip()
        location = data.get('location')
        date = data.get('date')
        time = data.get('time')
        end_date = data.get('eDate')
        end_time = data.get('eTime')

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

        # Validate and parse end_date
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD."}), 400

        # Validate and parse end_time
        if end_time:
            try:
                end_time = datetime.strptime(end_time, '%H:%M').time()
            except ValueError:
                return jsonify({"error": "Invalid end time format. Use HH:MM."}), 400

        # Create a new Event instance
        new_event = Event(
            title=title,
            location=location if location else None,
            event_date=date,
            event_time=time if time else None,
            end_date=end_date if end_date else None,
            end_time=end_time if end_time else None,
            user_id=user_id
        )

        print('New event:', new_event)

        # Add and commit to the database
        try:
            db.session.add(new_event)
            db.session.commit()
            return jsonify({
                "message": "Event added successfully",
                "event": new_event.to_dictTimefill()
            }), 201
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error adding event: {e}")
            return jsonify({"error": "An error occurred while adding the event."}), 500

# these methods haven't been implemented yet in javascript, but they will be necessary for modifying event data
@event_bp.route('/api/events/<int:event_id>', methods=['PUT', 'PATCH', 'DELETE'])
def modify_event(event_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    event = Event.query.filter_by(id=event_id, user_id=user_id).first()

    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    # modifying an event
    if request.method in ['PUT', 'PATCH']:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Update fields if they exist in the request
        if 'title' in data:
            event.title = data['title'].strip()
        
        if 'location' in data:
            event.location = data['location'] if data['location'] else None
        
        if 'date' in data:
            date = data['date']
            if date:
                try:
                    event.event_date = datetime.strptime(date, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
            else:
                event.date = None
        
        if 'time' in data:
            time = data['time'][0:5]
            if time:
                try:
                    event.event_time = datetime.strptime(time, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid time format. Use HH:MM."}), 400
            else:
                event.time = None

        if 'eDate' in data:
            date = data['eDate']
            if date:
                try:
                    event.end_date = datetime.strptime(date, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Invalid end date format. Use YYYY-MM-DD."}), 400
            else:
                event.end_date = None

        if 'eTime' in data:
            end = data['eTime'][0:5]
            if end:
                try:
                    event.end_time = datetime.strptime(end, '%H:%M').time()
                except ValueError:
                    return jsonify({"error": "Invalid end time format. Use HH:MM."}), 400
            else:
                event.end_time = None
        
        

        try:
            db.session.commit()
            return jsonify({
                "message": "Event updated successfully",
                "event": event.to_dictTimefill()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"An error occurred while updating the event: {e}"}), 500
    
    # deleting an event
    elif request.method == 'DELETE':
        try:
            db.session.delete(event)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting event: {e}")
            return jsonify({"error": "An error occurred while deleting the event."}), 500
        
@event_bp.route('/api/events/active/<string:date>', methods=['GET'])
def get_active_events(date):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']

    try:
        query_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    events = Event.query.filter(
        Event.user_id == user_id,
        Event.event_date <= query_date,
        (Event.end_date >= query_date) | (Event.end_date.is_(None))
    ).order_by(Event.event_date.asc(), Event.event_time.asc(), Event.id.asc()).all()

    return jsonify([event.to_dict() for event in events])