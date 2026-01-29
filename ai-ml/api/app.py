"""
Flask API for Face Recognition Service
Production-Ready, Stable Server
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

# Import from same directory
from api.face_service import FaceRecognitionService

app = Flask(__name__)
CORS(app)

# Initialize service
face_service = FaceRecognitionService()


@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'status': 'online',
        'service': 'Face Recognition API',
        'message': 'System is running normally. Use /health for detailed status.'
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Face Recognition API',
        'version': '2.0',
        'model': 'FaceNet (InceptionResnetV1 + MTCNN)',
        'embedding': '512-D vectors',
        'matching': 'Cosine Similarity',
        'mode': 'STRICT - Human faces only'
    }), 200


@app.route('/api/detect', methods=['POST'])
def detect_face():
    """
    Detect and validate human face in image
    
    Request:
        {
            "image": "base64_string"
        }
    
    Response:
        {
            "success": true/false,
            "faces": 0/1,
            "message": "...",
            "errors": [...]
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'faces': 0,
                'message': 'No JSON data received',
                'errors': ['Request body must be JSON']
            }), 400
        
        image_b64 = data.get('image')
        
        if not image_b64:
            print(f"[ERROR] No image in request. Keys: {list(data.keys()) if data else 'None'}")
            return jsonify({
                'success': False,
                'faces': 0,
                'message': 'No image provided',
                'errors': ['Image field is required']
            }), 400
        
        print(f"[INFO] Image received, length: {len(image_b64)} chars")
        
        # Decode image
        image = face_service.decode_base64_image(image_b64)
        if image is None:
            print(f"[ERROR] Failed to decode image")
            return jsonify({
                'success': False,
                'faces': 0,
                'message': 'Invalid image format',
                'errors': ['Could not decode image - ensure proper base64 encoding']
            }), 400
        
        # Detect faces
        face_locations, error = face_service.detect_faces(image)
        if error:
            return jsonify({
                'success': False,
                'faces': 0,
                'message': error,
                'errors': [error]
            }), 200  # 200 because this is expected behavior, not server error
        
        # Validate human face
        is_human, error = face_service.is_human_face(image, face_locations[0])
        if not is_human:
            return jsonify({
                'success': False,
                'faces': 0,
                'message': error,
                'errors': [error]
            }), 200
        
        # Success
        return jsonify({
            'success': True,
            'faces': 1,
            'message': 'Human face detected successfully',
            'errors': []
        }), 200
        
    except Exception as e:
        print(f"Detection error: {e}")
        return jsonify({
            'success': False,
            'faces': 0,
            'message': 'Internal server error',
            'errors': [str(e)]
        }), 500


@app.route('/api/register-face', methods=['POST'])
def register_face():
    """
    Register student face - generate 512-D FaceNet embedding
    
    Request:
        {
            "image": "base64_string"
        }
    
    Response:
        {
            "success": true/false,
            "encoding": [512 floats] or null,
            "error": "..." or null
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'encoding': None,
                'error': 'No JSON data received'
            }), 400
        
        image_b64 = data.get('image')
        
        if not image_b64:
            return jsonify({
                'success': False,
                'encoding': None,
                'error': 'Image field is required'
            }), 400
        
        # Process registration
        result = face_service.process_registration_image(image_b64)
        
        if not result['success']:
            return jsonify(result), 200  # Return validation errors with 200
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'encoding': None,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/api/recognize-attendance', methods=['POST'])
def recognize_attendance():
    """
    Recognize face in attendance image
    
    Request:
        {
            "capturedImage": "base64_string",
            "students": {
                "student_id": {
                    "encoding": [512 floats],
                    "name": "...",
                    "rollNumber": "..."
                },
                ...
            }
        }
    
    Response:
        {
            "success": true/false,
            "recognized": [
                {
                    "studentId": "...",
                    "confidence": 85.5,
                    "name": "...",
                    "rollNumber": "..."
                }
            ],
            "errors": [...]
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'recognized': [],
                'errors': ['No JSON data received']
            }), 400
        
        captured_image = data.get('capturedImage')
        students = data.get('students', {})
        
        if not captured_image:
            return jsonify({
                'success': False,
                'recognized': [],
                'errors': ['Captured image is required']
            }), 400
        
        if not students:
            return jsonify({
                'success': False,
                'recognized': [],
                'errors': ['No student data provided']
            }), 400
        
        # Process attendance
        result = face_service.process_attendance_image(captured_image, students)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Attendance recognition error: {e}")
        return jsonify({
            'success': False,
            'recognized': [],
            'errors': [f'Internal server error: {str(e)}']
        }), 500


@app.route('/api/verify-face', methods=['POST'])
def verify_face():
    """
    1:1 face verification using FaceNet cosine similarity
    
    Request:
        {
            "encoding1": [512 floats],
            "encoding2": [512 floats]
        }
    
    Response:
        {
            "success": true,
            "match": true/false,
            "confidence": 85.5
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'match': False,
                'confidence': 0.0,
                'error': 'No JSON data received'
            }), 400
        
        encoding1 = data.get('encoding1')
        encoding2 = data.get('encoding2')
        
        if not encoding1 or not encoding2:
            return jsonify({
                'success': False,
                'match': False,
                'confidence': 0.0,
                'error': 'Both encodings are required'
            }), 400
        
        # Match encodings
        confidence, is_match = face_service.match_face_encoding(encoding1, encoding2)
        
        return jsonify({
            'success': True,
            'match': is_match,
            'confidence': confidence
        }), 200
        
    except Exception as e:
        print(f"Verification error: {e}")
        return jsonify({
            'success': False,
            'match': False,
            'confidence': 0.0,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 70)
    print("FaceNet Face Recognition API Server Starting...")
    print("=" * 70)
    print("Mode: PRODUCTION (No Auto-Reload)")
    print("Model: FaceNet (InceptionResnetV1 + MTCNN)")
    print("Validation: STRICT - Human faces only")
    print("Encoding: 512-D vectors")
    print("Matching: Cosine Similarity (threshold: 0.6)")
    print("=" * 70)
    
    # Run in production mode - NO auto-reload
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=False,  # No debug mode
        use_reloader=False  # No auto-reload
    )