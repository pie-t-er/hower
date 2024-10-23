from models.extensions import db

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
    color = db.Column(db.String(7), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'location': self.location,
            'description': self.description,
            'date': self.event_date.isoformat(),
            'time': self.event_time.isoformat() if self.event_time else None,
            'eTime': self.end_time.isoformat() if self.event_time else None,
            'eDate': self.end_date.isoformat() if self.event_date else None,
            'user_id': self.user_id
        }