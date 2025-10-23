from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'kolberg_2_0_protocol_secret_key_2025'
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'status': 'active', 'version': '2.0.0-rewrite'})

@app.route('/api/aspid/upload', methods=['POST'])
def aspid_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    return jsonify({'status': 'success', 'filename': file.filename})

@app.route('/api/imwdp/kml', methods=['POST'])
def imwdp_kml():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    return jsonify({'status': 'success', 'filename': file.filename})

@app.route('/api/mkp2/send', methods=['POST'])
def mkp2_send():
    data = request.get_json()
    message = data.get('message', '')
    response_message = f"Protokół Kolberg 2.0 received: {message}"
    return jsonify({'status': 'success', 'response': response_message})

if __name__ == '__main__':
    print("Starting Protokół Kolberg 2.0 Server (Rewritten)...")
    app.run(host='0.0.0.0', port=5000, debug=True)
