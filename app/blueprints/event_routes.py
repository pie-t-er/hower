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
        events = Event.query.order_by(Event.event_date.asc(), Event.event_time.asc(), Event.id.asc()).all()
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
        notification_offset = data.get('notification_offset')
        if notification_offset is not None:
            try:
                notification_offset = int(notification_offset)
            except ValueError:
                return jsonify({"error": "Invalid notification offset."}), 400
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
            user_id=user_id,
            notification_offset=notification_offset,
        )

        print('New event:', new_event)

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
        if 'event' in data:
            event.content = data['event'].strip()
        
        if 'location' in data:
            event.location = data['location'] if data['location'] else None
        
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
        if 'notification_offset' in data:
            notification_offset = data['notification_offset']
            if notification_offset is not None:
                try:
                    event.notification_offset = int(notification_offset)
                except ValueError:
                    return jsonify({"error": "Invalid notification offset."}), 400
        try:
            db.session.commit()
            return jsonify({
                "message": "Event updated successfully",
                "event": event.to_dict()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while updating the event."}), 500
    
    # deleting an event
    elif request.method == 'DELETE':
        try:
            db.session.delete(event)
            db.session.commit()
            return jsonify({"message": "Event deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while deleting the event."}), 500
