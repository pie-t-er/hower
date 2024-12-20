from .extensions import db

# Task Model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    due_time = db.Column(db.Time, nullable=True)
    priority = db.Column(db.Integer, nullable=True)
    color = db.Column(db.String(7), nullable=True)  # Assuming you store color as HEX
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Change nullable to False when adding user authentication
    notification_offset = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'location': self.location,
            'due_date': str(self.due_date) if self.due_date else None,
            'due_time': str(self.due_time) if self.due_time else None,
            'priority': self.priority,
            'color': self.color,
            'user_id': self.user_id,
            'type': 'task',
            'notification_offset': self.notification_offset,
        }