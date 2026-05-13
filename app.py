from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'change-this-secret'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    if not room:
        return

    join_room(room)
    participants = rooms.setdefault(room, [])
    if request.sid not in participants:
        participants.append(request.sid)

    emit('joined', {'room': room, 'participantCount': len(participants)})

    if len(participants) == 2:
        emit('ready', {'initiator': participants[0]}, room=room)

@socketio.on('signal')
def handle_signal(data):
    room = data.get('room')
    if not room:
        return
    emit('signal', data, room=room, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    for room, participants in list(rooms.items()):
        if request.sid in participants:
            participants.remove(request.sid)
            leave_room(room)
            if not participants:
                rooms.pop(room, None)
            else:
                emit('peer-left', {'room': room}, room=room)

if __name__ == '__main__':
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        ssl_context='adhoc'
    )
