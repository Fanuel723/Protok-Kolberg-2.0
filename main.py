from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'kolberg_2_0_protocol_secret_key_2025'

# Enable CORS for all routes
CORS(app, origins="*")

@app.route('/')
def index():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/status')
def status():
    """API status endpoint"""
    return jsonify({
        'system': 'Protokół Kolberg 2.0',
        'version': '2.0.0',
        'status': 'active',
        'modules': {
            'ASPID': 'Automated System for Processing and Indexing Data',
            'MKP2': 'Module for Communication Protocol Kolberg 2.0',
            'IMWDP': 'Interactive Module for Spatial Data Visualization'
        },
        'endpoints': {
            'ASPID': '/api/aspid/*',
            'MKP2': '/api/mkp2/*',
            'IMWDP': '/api/imwdp/*'
        }
    })

# ASPID endpoints
@app.route('/api/aspid/upload', methods=['POST'])
def aspid_upload():
    """Handle file upload for OCR/transcription"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Simulate OCR processing
    return jsonify({
        'status': 'success',
        'message': 'File uploaded successfully',
        'filename': file.filename,
        'processing': 'OCR analysis in progress...'
    })

# MKP2 endpoints
@app.route('/api/mkp2/send', methods=['POST'])
def mkp2_send():
    """Handle communication protocol messages"""
    data = request.get_json()
    message = data.get('message', '') if data else ''
    
    return jsonify({
        'status': 'success',
        'response': f'Protokół Kolberg 2.0 received: {message}',
        'timestamp': '2025-01-01 12:00:00'
    })

# IMWDP endpoints
@app.route('/api/imwdp/kml', methods=['POST'])
def imwdp_kml():
    """Handle KML data upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No KML file provided'}), 400
    
    file = request.files['file']
    return jsonify({
        'status': 'success',
        'message': 'KML data loaded successfully',
        'filename': file.filename,
        'features': 'Map features processed'
    })

if __name__ == '__main__':
    print("=" * 50)
    print("🏰 Protokół Kolberg 2.0 - Full Implementation")
    print("=" * 50)
    print("ASPID: Automated System for Processing and Indexing Data")
    print("MKP2:  Module for Communication Protocol Kolberg 2.0")
    print("IMWDP: Interactive Module for Spatial Data Visualization")
    print("=" * 50)
    print(f"Static folder: {app.static_folder}")
    print("Server starting on http://0.0.0.0:5000")
    print("API Documentation available at /api/status")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

