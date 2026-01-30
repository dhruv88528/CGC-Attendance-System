# Face Recognition Service Implementation
import face_recognition
import numpy as np
import base64
import io
from PIL import Image
import cv2

class FaceRecognitionService:
    def __init__(self):
        self.tolerance = 0.6  # Lower = more strict matching
        
    def decode_base64_image(self, base64_string):
        """Convert base64 string to numpy array"""
        try:
            # Remove data:image prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            return np.array(image)
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def detect_faces(self, image_array):
        """
        Detect faces in image
        Returns: List of face locations
        """
        try:
            face_locations = face_recognition.face_locations(image_array)
            return face_locations
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []
    
    def encode_face(self, image_array, face_location=None):
        """
        Generate face encoding (128-d vector)
        Returns: Face encoding array or None
        """
        try:
            if face_location:
                encodings = face_recognition.face_encodings(image_array, [face_location])
            else:
                encodings = face_recognition.face_encodings(image_array)
            
            if len(encodings) > 0:
                return encodings[0].tolist()  # Convert to list for JSON serialization
            return None
        except Exception as e:
            print(f"Error encoding face: {e}")
            return None
    
    def compare_faces(self, known_encoding, unknown_encoding):
        """
        Compare two face encodings
        Returns: (is_match, distance)
        """
        try:
            known = np.array(known_encoding)
            unknown = np.array(unknown_encoding)
            
            distance = face_recognition.face_distance([known], unknown)[0]
            is_match = distance <= self.tolerance
            
            return is_match, float(distance)
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return False, 1.0
    
    def process_student_registration(self, image_base64):
        """
        Process student registration image
        Returns: {success, encoding, face_location}
        """
        image_array = self.decode_base64_image(image_base64)
        if image_array is None:
            return {"success": False, "error": "Invalid image"}
        
        face_locations = self.detect_faces(image_array)
        
        if len(face_locations) == 0:
            return {"success": False, "error": "No face detected"}
        
        if len(face_locations) > 1:
            return {"success": False, "error": "Multiple faces detected. Please use image with single person."}
        
        encoding = self.encode_face(image_array, face_locations[0])
        
        if encoding is None:
            return {"success": False, "error": "Failed to encode face"}
        
        return {
            "success": True,
            "encoding": encoding,
            "face_location": face_locations[0]
        }
    
    def process_attendance_image(self, image_base64, student_encodings):
        """
        Process attendance classroom image
        student_encodings: dict of {student_id: encoding}
        Returns: List of recognized students with confidence
        """
        image_array = self.decode_base64_image(image_base64)
        if image_array is None:
            return {"success": False, "error": "Invalid image"}
        
        face_locations = self.detect_faces(image_array)
        
        if len(face_locations) == 0:
            return {"success": False, "error": "No faces detected"}
        
        recognized = []
        
        for face_location in face_locations:
            face_encoding = self.encode_face(image_array, face_location)
            
            if face_encoding is None:
                continue
            
            # Compare with all known students
            best_match = None
            best_distance = 1.0
            
            for student_id, known_encoding in student_encodings.items():
                is_match, distance = self.compare_faces(known_encoding, face_encoding)
                
                if is_match and distance < best_distance:
                    best_match = student_id
                    best_distance = distance
            
            if best_match:
                confidence = 1.0 - best_distance  # Convert distance to confidence
                recognized.append({
                    "studentId": best_match,
                    "confidence": float(confidence),
                    "face_location": face_location
                })
        
        return {
            "success": True, 
            "recognized": recognized,
            "total_faces": len(face_locations)
        }