from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import zipfile
import tempfile
import shutil
from xxe_generator import XXEGenerator
from xlsx_processor import XLSXProcessor
from werkzeug.utils import secure_filename

# Use /tmp for Lambda, local processed/ for local dev
PROCESSED_DIR = os.environ.get('PROCESSED_DIR', os.path.join(os.path.dirname(__file__), 'processed'))

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '../frontend/build'), static_url_path='')
CORS(app)

xxe_gen = XXEGenerator()
xlsx_proc = XLSXProcessor(PROCESSED_DIR)

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'XXE XLSX Tool Backend is running', 'version': '1.0.0'})

@app.route('/api/generate-payloads', methods=['POST'])
def generate_payloads():
    try:
        data = request.get_json()
        target_url = data.get('target_url', '')
        collaborator = data.get('collaborator', '')
        attack_type = data.get('attack_type', 'all')
        payloads = xxe_gen.generate_payloads(target_url, collaborator, attack_type)
        return jsonify({'success': True, 'payloads': payloads, 'count': len(payloads)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/inject-xxe', methods=['POST'])
def inject_xxe():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        payload_type = request.form.get('payload_type', 'doctype')
        payload = request.form.get('payload', '')
        collaborator = request.form.get('collaborator', '')

        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400

        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)

        try:
            if filename.lower().endswith('.zip'):
                result = process_zip_file(temp_path, payload_type, payload, collaborator)
            elif filename.lower().endswith('.xlsx'):
                result = xlsx_proc.inject_xxe(temp_path, payload_type, payload, collaborator)
            else:
                return jsonify({'error': 'Only XLSX and ZIP files are supported.'}), 400
            return jsonify(result)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def process_zip_file(zip_path, payload_type, payload, collaborator):
    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)

        results = []
        processed_files = []

        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.lower().endswith('.xlsx'):
                    result = xlsx_proc.inject_xxe(os.path.join(root, file), payload_type, payload, collaborator)
                    if result['success']:
                        processed_files.append(file)
                        results.append(result)

        if not processed_files:
            return {'success': False, 'error': 'No XLSX files found in ZIP'}

        output_filename = f"xxe_batch_{len(processed_files)}_files.zip"
        output_path = os.path.join(PROCESSED_DIR, output_filename)
        os.makedirs(PROCESSED_DIR, exist_ok=True)

        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as out_zip:
            for result in results:
                fp = os.path.join(PROCESSED_DIR, result['output_filename'])
                if os.path.exists(fp):
                    out_zip.write(fp, result['output_filename'])

        return {'success': True, 'output_filename': output_filename, 'processed_files': processed_files, 'total_files': len(processed_files)}
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route('/api/analyze-file', methods=['POST'])
def analyze_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)

        try:
            if filename.lower().endswith('.zip'):
                analysis = analyze_zip_structure(temp_path)
            elif filename.lower().endswith('.xlsx'):
                analysis = xlsx_proc.analyze_xlsx_structure(temp_path)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
            return jsonify({'success': True, 'analysis': analysis})
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def analyze_zip_structure(zip_path):
    analysis = {'type': 'zip', 'xlsx_files': [], 'total_files': 0, 'other_files': []}
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        analysis['total_files'] = len(file_list)
        for f in file_list:
            if f.lower().endswith('.xlsx'):
                analysis['xlsx_files'].append(f)
            else:
                analysis['other_files'].append(f)
    return analysis

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        file_path = os.path.join(PROCESSED_DIR, secure_filename(filename))
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting XXE XLSX Tool Backend on port {port}...")
    app.run(debug=False, host='0.0.0.0', port=port)
