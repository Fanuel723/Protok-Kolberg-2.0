from flask import Flask, render_template, jsonify, request, session, redirect, url_for, flash
from functools import wraps
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from google.cloud import vision, speech

# --- App Configuration & Constants ---
app = Flask(__name__, template_folder='templates', static_folder='static')
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'a_very_secret_key'),
    UPLOAD_FOLDER='uploads',
    MAX_CONTENT_LENGTH=150 * 1024 * 1024,
)
DATABASE = 'database.db'
MIN_CONTENT_LENGTH = 15
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'default_password')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'mp4', 'mov'}
CORS(app)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

# --- Database Management ---
def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# --- Authentication ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# --- Helper Functions ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_content_filters(text):
    if not text or len(text.strip()) < MIN_CONTENT_LENGTH:
        return 'Wymaga Weryfikacji', f'Treść krótsza niż {MIN_CONTENT_LENGTH} znaków'
    return 'Nowe', None

def get_gps_from_exif(image_path):
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data: return None, None

        gps_info_raw = next((exif_data[t] for t in exif_data if TAGS.get(t) == 'GPSInfo'), None)
        if not gps_info_raw: return None, None

        gps_info = {GPSTAGS.get(t, t): gps_info_raw[t] for t in gps_info_raw}

        def dms_to_decimal(dms, ref):
            degrees = dms[0] + dms[1] / 60.0 + dms[2] / 3600.0
            return -degrees if ref in ['S', 'W'] else degrees

        lat = dms_to_decimal(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
        lon = dms_to_decimal(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])
        return lat, lon
    except Exception as e:
        print(f"Error extracting GPS: {e}")
        return None, None

def process_api_call(client_class, file_path, logic):
    if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ: return None
    try:
        client = client_class()
        with open(file_path, 'rb') as f:
            content = f.read()
        return logic(client, content)
    except Exception as e:
        print(f"API call failed for {client_class.__name__}: {e}")
        return None

def get_ocr_text(path):
    return process_api_call(vision.ImageAnnotatorClient, path,
        lambda c, b: c.text_detection(image=vision.Image(content=b)).text_annotations[0].description)

def analyze_image(path):
    return process_api_call(vision.ImageAnnotatorClient, path,
        lambda c, b: [l.description.lower() for l in c.label_detection(image=vision.Image(content=b)).label_annotations])

def get_transcription(path):
    return process_api_call(speech.SpeechClient, path,
        lambda c, b: c.recognize(config=speech.RecognitionConfig(language_code="pl-PL"), audio=speech.RecognitionAudio(content=b)).results[0].alternatives[0].transcript)

# --- Core Logic ---
def process_file_submission(db, submission_id, file_path, file_type):
    # Initialize all possible outputs
    przetworzony_tekst, lat, lon, zrodlo_gps = None, None, None, 'brak'
    status = 'Nowe'  # Default status
    powod_weryfikacji = None

    # --- Step 1: Extract data from file ---
    if file_type == 'image':
        lat, lon = get_gps_from_exif(file_path)
        if lat and lon:
            zrodlo_gps = 'metadata'

        labels = analyze_image(file_path)
        # Added 'handwriting' to label checks for more robust OCR trigger
        if labels and any(l in labels for l in ['text', 'document', 'font', 'handwriting']):
            przetworzony_tekst = get_ocr_text(file_path)
    
    elif file_type == 'audio':
        przetworzony_tekst = get_transcription(file_path)

    # --- Step 2: Determine status based on extracted data ---
    
    # First, check text content if we have any. This handles short text, profanity, etc.
    if przetworzony_tekst:
        status, powod_weryfikacji = run_content_filters(przetworzony_tekst)

    # If the content passed the text filters (or there was no text),
    # run a final check for overall submission value.
    if status == 'Nowe':
        # A submission is considered valuable if it has GPS data OR some processed text.
        is_valuable_image = (file_type == 'image' and lat and lon)
        is_valuable_text = (przetworzony_tekst is not None and len(przetworzony_tekst.strip()) > 0)

        # If it's not valuable by either metric, it needs verification.
        if not is_valuable_image and not is_valuable_text:
            status = 'Wymaga Weryfikacji'
            powod_weryfikacji = 'Brak użytecznych danych (tekst lub GPS)'

    # --- Step 3: Save to database ---
    db.execute("INSERT INTO teczki (submission_id, status, powod_weryfikacji, przetworzony_tekst, latitude, longitude, zrodlo_gps) VALUES (?, ?, ?, ?, ?, ?, ?)",
               (submission_id, status, powod_weryfikacji, przetworzony_tekst, lat, lon, zrodlo_gps))

# --- Public Routes & API ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/submissions')
def api_submissions():
    rows = get_db().execute("SELECT t.latitude, t.longitude, s.original_filename FROM teczki t JOIN submissions s ON t.submission_id = s.id WHERE t.zrodlo_gps = 'metadata' AND t.latitude IS NOT NULL").fetchall()
    return jsonify([dict(row) for row in rows])

@app.route('/api/map/szepty-i-cienie')
def api_szepty():
    rows = get_db().execute("SELECT t.latitude, t.longitude, s.original_filename, t.przetworzony_tekst FROM teczki t JOIN submissions s ON t.submission_id = s.id WHERE t.status = 'Zatwierdzone' AND t.zweryfikowane_gps = 1").fetchall()
    return jsonify([dict(row) for row in rows])

@app.route('/api/mkp2/send', methods=['POST'])
@limiter.limit("10 per minute")
def api_mkp2_send():
    message = request.json.get('message', '').strip()
    if not message: return jsonify({'error': 'Empty message'}), 400
    
    db = get_db()
    cursor = db.execute("INSERT INTO submissions (submission_type, content) VALUES ('message', ?)", (message,))
    submission_id = cursor.lastrowid

    status, powod_weryfikacji = run_content_filters(message)
    
    db.execute("INSERT INTO teczki (submission_id, status, powod_weryfikacji, przetworzony_tekst) VALUES (?, ?, ?, ?)",
               (submission_id, status, powod_weryfikacji, message))
    db.commit()
    return jsonify({'status': 'success'})

@app.route('/api/aspid/upload', methods=['POST'])
@limiter.limit("5 per minute")
def api_aspid_upload():
    if 'file' not in request.files: return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if not file or not file.filename or not allowed_file(file.filename): return jsonify({'error': 'Invalid file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}")
    file.save(file_path)

    db = get_db()
    cursor = db.execute("INSERT INTO submissions (submission_type, original_filename, stored_filename) VALUES (?, ?, ?)",
                        (file.mimetype.split('/')[0], filename, file_path))
    process_file_submission(db, cursor.lastrowid, file_path, file.mimetype.split('/')[0])
    db.commit()
    return jsonify({'status': 'success'})

# --- Admin Panel Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form.get('username') == ADMIN_USERNAME and request.form.get('password') == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('admin'))
        flash('Nieprawidłowe dane logowania.', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin():
    status_filter = request.args.get('status')
    db = get_db()
    # Corrected the query to include the submission timestamp (s.timestamp)
    query = "SELECT t.id, s.submission_type, s.timestamp, t.powod_weryfikacji, t.przetworzony_tekst, s.original_filename, t.status FROM teczki t JOIN submissions s ON t.submission_id = s.id"
    params = []
    if status_filter:
        query += " WHERE t.status = ?"
        params.append(status_filter)
    query += " ORDER BY s.timestamp DESC"
    teczki = db.execute(query, params).fetchall()
    return render_template('admin.html', teczki=teczki, active_filter=status_filter)

@app.route('/teczka/<int:teczka_id>', methods=['GET', 'POST'])
@login_required
def edit_teczka(teczka_id):
    db = get_db()
    if request.method == 'POST':
        form = request.form
        zweryfikowane_gps = form.get('zrodlo_gps') == 'manual'
        db.execute("UPDATE teczki SET kategoria=?, status=?, notatki_analityka=?, latitude=?, longitude=?, zrodlo_gps=?, zweryfikowane_gps=? WHERE id=?",
                   (form['kategoria'], form['status'], form['notatki_analityka'], form.get('latitude'), form.get('longitude'), form.get('zrodlo_gps'), zweryfikowane_gps, teczka_id))
        db.commit()
        flash('Teczka zaktualizowana.', 'success')
        return redirect(url_for('admin'))

    teczka = db.execute("SELECT t.*, s.original_filename FROM teczki t JOIN submissions s ON t.submission_id = s.id WHERE t.id = ?", (teczka_id,)).fetchone()
    if not teczka: return redirect(url_for('admin'))

    kategorie = ["Legendy miejskie", "Relacje świadków", "Szepty o skarbach", "Zapomniane rytuały", "Nawiedzone miejsca", "Krypty i podziemia", "Szyfry i zagadki", "Tajemnicze zniknięcia", "Lokalne klątwy", "Bestie i potwory", "Znaki na polach", "Przesądy i gusła", "Starożytne artefakty", "Ukryte przejścia", "Teorie spiskowe", "Zjawiska paranormalne", "Opowieści wojenne", "Dawne mapy i plany", "Zaginione osady", "Cmentarze i upiory", "Skarby rodowe", "Kroniki i pamiętniki", "Sekretne stowarzyszenia", "Miejsca mocy", "Niewyjaśnione dźwięki"]
    
    # Fetch the timestamp from the related submission
    submission_timestamp = db.execute("SELECT timestamp FROM submissions WHERE id = ?", (teczka['submission_id'],)).fetchone()['timestamp']

    return render_template('edit_teczka.html', teczka=teczka, kategorie=kategorie, submission_timestamp=submission_timestamp)

# --- Main Execution ---
if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    init_db()
    app.run(host='0.0.0.0', port=5000)
