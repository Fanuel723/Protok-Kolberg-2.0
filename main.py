from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'kolberg_2_0_protocol_secret_key_2025'
app.config['UPLOAD_FOLDER'] = 'uploads'
CORS(app)

def init_db():
    conn = sqlite3.connect('database.db')
    print("Opened database successfully")
    conn.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)')
    print("Table created successfully")
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/offline.html')
def offline():
    return render_template('offline.html')

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'status': 'active', 'version': '2.0.0-rewrite'})

@app.route('/api/aspid/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'status': 'success', 'filename': filename})

@app.route('/api/mkp2/send', methods=['POST'])
def mkp2_send():
    data = request.get_json()
    message = data.get('message', '')

    with sqlite3.connect("database.db") as con:
        cur = con.cursor()
        cur.execute("INSERT INTO messages (content) VALUES (?)", (message,))
        con.commit()

    response_message = f"Protokół Kolberg 2.0 received and stored: {message}"
    return jsonify({'status': 'success', 'response': response_message})

if __name__ == '__main__':
    print("Starting Protokół Kolberg 2.0 Server (Rewritten)...")
    app.run(host='0.0.0.0', port=5000, debug=True)
