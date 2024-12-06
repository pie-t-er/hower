from .extensions import db

# Event Model
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    event_date = db.Column(db.Date, nullable=False)
    event_time = db.Column(db.Time, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notification_offset = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'location': self.location if self.location else None,
            'description': self.description if self.description else None,
            'date': self.event_date.isoformat() if self.event_date else None,
            'time': self.event_time.isoformat() if self.event_time else None,
            'eTime': self.end_time.isoformat() if self.end_time else None,
            'eDate': self.end_date.isoformat() if self.end_date else None,
            'user_id': self.user_id,
            'type': 'event',
            'notification_offset': self.notification_offset,
        }
       
    def to_dictTimefill(self):
        return {
            'id': self.id,
            'title': self.title,
            'location': self.location if self.location else None,
            'description': self.description if self.description else None,
            'date': str(self.event_date) if self.event_date else None,
            'time': str(self.event_time) if self.event_time else None,
            'eTime': str(self.end_time) if self.end_time else None,
            'eDate': str(self.end_date) if self.end_date else None,
            'user_id': self.user_id,
            'type': 'event',
            'notification_offset': self.notification_offset,
        }
    
