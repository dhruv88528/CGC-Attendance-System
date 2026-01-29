
"""
Face Recognition Service using FaceNet
Handles face detection, encoding, and matching with 512-D embeddings
Uses InceptionResnetV1 model pre-trained on VGGFace2
"""

import cv2
import numpy as np
import base64
from typing import Tuple, List, Optional, Dict
import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image


class FaceRecognitionService:
    """
    FaceNet-Based Face Recognition Service for Attendance System
    
    Features:
    - MTCNN for face detection (highly accurate)
    - InceptionResnetV1 for 512-D embeddings
    - Cosine similarity for face matching
    - Only human faces (no animals/objects)
    - Only 1 face per image for registration
    
    Requirements:
    - Detection confidence >= 0.95
    - 512-D face embedding
    - Cosine similarity threshold 0.6 for matching
    """
    
    # Thresholds
    MIN_CONFIDENCE = 0.95      # MTCNN detection confidence
    SIMILARITY_THRESHOLD = 0.6  # Cosine similarity threshold (higher = more similar)
    MIN_FACE_SIZE = 60         # Minimum face size in pixels
    
    def __init__(self):
        """Initialize FaceNet models"""
        # Set device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[FaceNet] Using device: {self.device}")
        
        # Initialize MTCNN for face detection
        # Keep all faces initially, we'll filter by confidence
        self.mtcnn = MTCNN(
            image_size=160,
            margin=20,
            min_face_size=self.MIN_FACE_SIZE,
            thresholds=[0.6, 0.7, 0.7],  # MTCNN stage thresholds
            factor=0.709,
            post_process=True,
            device=self.device,
            keep_all=True  # Get all detected faces
        )
        
        # Initialize FaceNet model (InceptionResnetV1 pretrained on VGGFace2)
        self.facenet = InceptionResnetV1(
            pretrained='vggface2',
            device=self.device
        ).eval()
        
        print("[FaceNet] Models loaded successfully")
    
    @staticmethod
    def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
        """
        Decode base64 string to OpenCV image
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            numpy array (BGR) or None if invalid
        """
        try:
            # Remove data URL prefix if present
            if 'base64,' in base64_string:
                base64_string = base64_string.split('base64,')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(base64_string)
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return image
        except Exception as e:
            print(f"[FaceNet] Error decoding image: {e}")
            return None
    
    def detect_faces(self, image: np.ndarray) -> Tuple[List[Dict], str]:
        """
        Detect faces in image using MTCNN
        
        Args:
            image: OpenCV image (BGR)
            
        Returns:
            (face_data_list, error_message)
            face_data_list: List of {'box': [x1,y1,x2,y2], 'confidence': float, 'aligned_face': tensor}
            error_message: Empty string if success, error message otherwise
        """
        if image is None:
            return [], "Invalid image"
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        
        # Detect faces with MTCNN
        boxes, probs, landmarks = self.mtcnn.detect(pil_image, landmarks=True)
        
        if boxes is None or len(boxes) == 0:
            return [], "No face detected - please position your face in the camera"
        
        # Filter by confidence
        high_confidence_faces = []
        for i, (box, prob) in enumerate(zip(boxes, probs)):
            if prob >= self.MIN_CONFIDENCE:
                x1, y1, x2, y2 = box
                face_width = x2 - x1
                face_height = y2 - y1
                
                # Check face size
                if face_width >= self.MIN_FACE_SIZE and face_height >= self.MIN_FACE_SIZE:
                    high_confidence_faces.append({
                        'box': box.tolist(),
                        'confidence': float(prob),
                        'landmarks': landmarks[i].tolist() if landmarks is not None else None
                    })
        
        if len(high_confidence_faces) == 0:
            return [], f"Face detected but confidence too low (min {self.MIN_CONFIDENCE * 100}% required) - ensure good lighting and face the camera directly"
        
        if len(high_confidence_faces) > 1:
            return [], f"Multiple faces detected ({len(high_confidence_faces)}) - only one person allowed"
        
        return high_confidence_faces, ""
    
    def is_human_face(self, image: np.ndarray, face_data: Dict) -> Tuple[bool, str]:
        """
        Validate if detected face is actually a human face
        Uses facial landmarks from MTCNN
        
        Args:
            image: BGR image
            face_data: Dictionary with 'box', 'confidence', 'landmarks'
            
        Returns:
            (is_human, error_message)
        """
        try:
            landmarks = face_data.get('landmarks')
            
            if landmarks is None:
                return False, "Human face required - no facial features detected"
            
            # MTCNN returns 5 landmarks: left_eye, right_eye, nose, mouth_left, mouth_right
            if len(landmarks) < 5:
                return False, "Human face required - incomplete facial features"
            
            left_eye, right_eye, nose, mouth_left, mouth_right = landmarks
            
            # Validate landmark positions (basic sanity checks)
            # Eyes should be above nose
            if left_eye[1] > nose[1] or right_eye[1] > nose[1]:
                return False, "Invalid face orientation - please face the camera directly"
            
            # Nose should be above mouth
            if nose[1] > mouth_left[1] or nose[1] > mouth_right[1]:
                return False, "Invalid face orientation - please face the camera directly"
            
            # Eyes should be at similar height (tolerance of 20 pixels)
            if abs(left_eye[1] - right_eye[1]) > 30:
                return False, "Face tilted too much - please straighten your head"
            
            return True, ""
            
        except Exception as e:
            print(f"[FaceNet] Landmark validation error: {e}")
            return False, "Face validation failed - please try again"
    
    def generate_face_encoding(self, image: np.ndarray, face_data: Dict) -> Optional[List[float]]:
        """
        Generate 512-D face embedding using FaceNet
        
        Args:
            image: OpenCV image (BGR)
            face_data: Dictionary with 'box' coordinates
            
        Returns:
            List of 512 floats or None if failed
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)
            
            # Get aligned face using MTCNN (single face mode)
            # Create a temporary MTCNN for single face extraction
            box = face_data['box']
            
            # Extract and align face
            face_tensor = self.mtcnn(pil_image)
            
            if face_tensor is None:
                print("[FaceNet] Failed to extract aligned face")
                return None
            
            # If multiple faces were detected, take the first one
            if len(face_tensor.shape) == 4:
                face_tensor = face_tensor[0]
            
            # Add batch dimension
            face_tensor = face_tensor.unsqueeze(0).to(self.device)
            
            # Generate embedding
            with torch.no_grad():
                embedding = self.facenet(face_tensor)
            
            # Convert to list for JSON serialization
            embedding_list = embedding.cpu().numpy()[0].tolist()
            
            print(f"[FaceNet] Generated embedding with {len(embedding_list)} dimensions")
            return embedding_list
            
        except Exception as e:
            print(f"[FaceNet] Encoding error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: 512-D embedding
            embedding2: 512-D embedding
            
        Returns:
            Similarity score between -1 and 1 (higher = more similar)
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def match_face_encoding(self, known_encoding: List[float], unknown_encoding: List[float]) -> Tuple[float, bool]:
        """
        Match face encoding using cosine similarity
        
        Args:
            known_encoding: 512-D encoding from database
            unknown_encoding: 512-D encoding from captured image
            
        Returns:
            (confidence_percentage, is_match)
            confidence: 0-100 percentage
            is_match: True if similarity >= threshold
        """
        try:
            # Calculate cosine similarity
            similarity = self.cosine_similarity(known_encoding, unknown_encoding)
            
            # Convert to confidence percentage (similarity is already 0-1 for normalized vectors)
            # Map from [-1, 1] to [0, 100]
            confidence = ((similarity + 1) / 2) * 100
            
            # For matching, we use raw similarity
            is_match = similarity >= self.SIMILARITY_THRESHOLD
            
            return round(confidence, 2), is_match
            
        except Exception as e:
            print(f"[FaceNet] Matching error: {e}")
            return 0.0, False
    
    def process_registration_image(self, base64_image: str) -> Dict:
        """
        Process image for student registration
        
        Args:
            base64_image: Base64 encoded image
            
        Returns:
            {
                'success': bool,
                'encoding': List[float] or None,  # 512-D embedding
                'error': str or None
            }
        """
        result = {
            'success': False,
            'encoding': None,
            'error': None
        }
        
        # Decode image
        image = self.decode_base64_image(base64_image)
        if image is None:
            result['error'] = "Invalid image format"
            return result
        
        # Detect faces
        face_data_list, error = self.detect_faces(image)
        if error:
            result['error'] = error
            return result
        
        face_data = face_data_list[0]
        
        # Validate human face
        is_human, error = self.is_human_face(image, face_data)
        if not is_human:
            result['error'] = error
            return result
        
        # Generate encoding
        encoding = self.generate_face_encoding(image, face_data)
        if encoding is None:
            result['error'] = "Failed to generate face encoding"
            return result
        
        result['success'] = True
        result['encoding'] = encoding
        
        return result
    
    def process_attendance_image(self, base64_image: str, student_encodings: Dict[str, Dict]) -> Dict:
        """
        Process image for attendance marking
        
        Args:
            base64_image: Base64 encoded classroom image
            student_encodings: {student_id: {'encoding': [...], 'name': str, 'rollNumber': str}}
            
        Returns:
            {
                'success': bool,
                'recognized': [{'studentId': str, 'confidence': float, 'name': str, 'rollNumber': str}],
                'errors': [str]
            }
        """
        result = {
            'success': False,
            'recognized': [],  # Changed from 'matches' to match backend expectation
            'errors': []
        }
        
        # Decode image
        image = self.decode_base64_image(base64_image)
        if image is None:
            result['errors'].append("Invalid image format")
            return result
        
        # Detect faces
        face_data_list, error = self.detect_faces(image)
        if error:
            result['errors'].append(error)
            return result
        
        face_data = face_data_list[0]
        
        # Validate human face
        is_human, error = self.is_human_face(image, face_data)
        if not is_human:
            result['errors'].append(error)
            return result
        
        # Generate encoding
        captured_encoding = self.generate_face_encoding(image, face_data)
        if captured_encoding is None:
            result['errors'].append("Failed to generate face encoding")
            return result
        
        print(f"[Recognition] Comparing with {len(student_encodings)} stored encodings...")
        
        # Compare with all student encodings
        best_match = None
        best_confidence = 0.0
        
        for student_id, student_data in student_encodings.items():
            stored_encoding = student_data.get('encoding')
            if not stored_encoding:
                print(f"[Recognition] Student {student_id} has no encoding, skipping")
                continue
            
            confidence, is_match = self.match_face_encoding(
                stored_encoding, 
                captured_encoding
            )
            
            print(f"[Recognition] Student {student_id}: confidence={confidence:.2f}%, match={is_match}")
            
            if is_match and confidence > best_confidence:
                best_confidence = confidence
                best_match = {
                    'studentId': student_id,
                    'confidence': confidence,
                    'name': student_data.get('name', 'Unknown'),
                    'rollNumber': student_data.get('rollNumber', '')
                }
        
        if best_match:
            result['success'] = True
            result['recognized'].append(best_match)  # Changed from 'matches'
            print(f"[Recognition] ✅ Match found: {best_match['name']} ({best_match['confidence']:.2f}%)")
        else:
            result['errors'].append("No matching student found - face not registered or confidence too low")
            print(f"[Recognition] ❌ No match found. Best confidence was {best_confidence:.2f}%")
        
        return result
