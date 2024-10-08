from models.extensions import db

# User Model for Authentication
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    tasks = db.relationship('Task', backref='creator', lazy=True)  # Changed backref to 'creator'
    events = db.relationship('Event', backref='organizer', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'username': self.username}
