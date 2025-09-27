import os
import numpy as np, cv2
from typing import Optional
try:
    import onnxruntime as ort  # type: ignore
except Exception:  # onnxruntime may be unavailable
    ort = None

class ArcFaceCPU:
    def __init__(self):
        self._fallback = True
        self.sess = None
        self.input_name = None
        model_path = "app/models/arcface_r100.onnx"
        if ort is not None and os.path.exists(model_path):
            try:
                so = ort.SessionOptions()
                so.intra_op_num_threads = max(1, int(cv2.getNumberOfCPUs()/2))
                self.sess = ort.InferenceSession(
                    model_path,
                    sess_options=so,
                    providers=["CPUExecutionProvider"],
                )
                self.input_name = self.sess.get_inputs()[0].name
                self._fallback = False
            except Exception as exc:
                print(f"[face] ONNX unavailable, using fallback embedding: {exc}")
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    def _detect(self, bgr: np.ndarray) -> Optional[np.ndarray]:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        
        # Enhanced face detection with multiple scales and parameters
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1,  # More sensitive scaling
            minNeighbors=6,   # Require more neighbors for better detection
            minSize=(50, 50), # Minimum face size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        if len(faces) == 0: 
            return None
            
        # Select the largest face with better quality criteria
        best_face = None
        best_score = 0
        
        for (x, y, w, h) in faces:
            # Calculate face quality score based on size and aspect ratio
            area = w * h
            aspect_ratio = w / h
            
            # Prefer faces that are reasonably sized and have good aspect ratio
            if 0.7 <= aspect_ratio <= 1.4 and area > 2500:  # Minimum area threshold
                # Additional quality check: face should be reasonably centered
                img_center_x, img_center_y = bgr.shape[1] // 2, bgr.shape[0] // 2
                face_center_x, face_center_y = x + w // 2, y + h // 2
                center_distance = np.sqrt((face_center_x - img_center_x)**2 + (face_center_y - img_center_y)**2)
                max_distance = np.sqrt(img_center_x**2 + img_center_y**2)
                center_score = 1 - (center_distance / max_distance)
                
                # Combined score: area + aspect ratio + center position
                score = area * (1 + center_score) * (2 - abs(aspect_ratio - 1))
                
                if score > best_score:
                    best_score = score
                    best_face = (x, y, w, h)
        
        if best_face is None:
            return None
            
        x, y, w, h = best_face
        
        # Extract face with some padding for better context
        padding = int(min(w, h) * 0.1)  # 10% padding
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(bgr.shape[1] - x, w + 2 * padding)
        h = min(bgr.shape[0] - y, h + 2 * padding)
        
        crop = bgr[y:y+h, x:x+w]
        
        # Apply histogram equalization for better lighting
        crop = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
        crop[:,:,0] = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(crop[:,:,0])
        crop = cv2.cvtColor(crop, cv2.COLOR_LAB2BGR)
        
        # Resize to model input size
        crop = cv2.resize(crop, (112, 112), interpolation=cv2.INTER_LANCZOS4)
        
        # Convert to RGB and normalize
        crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        crop = (crop.astype(np.float32) - 127.5) / 128.0
        
        # Transpose to CHW format
        chw = np.transpose(crop, (2, 0, 1))[None, ...]
        return chw

    def embed(self, img_bytes: bytes) -> Optional[np.ndarray]:
        arr = np.frombuffer(img_bytes, np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None: return None
        blob = self._detect(bgr)
        if blob is None and not self._fallback:
            return None
        if not self._fallback and self.sess is not None and self.input_name is not None and blob is not None:
            out = self.sess.run(None, {self.input_name: blob})[0][0]
            norm = np.linalg.norm(out) + 1e-9
            return (out / norm).astype(np.float32)
        # Fallback: deterministic 512-d embedding from image bytes
        import hashlib
        h = hashlib.blake2b(img_bytes, digest_size=32).digest()
        seed = int.from_bytes(h, "little", signed=False) % (2**32 - 1)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(512).astype(np.float32)
        vec /= (np.linalg.norm(vec) + 1e-9)
        return vec

engine_arc = ArcFaceCPU()