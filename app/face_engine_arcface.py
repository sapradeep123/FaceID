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
        faces = self.face_cascade.detectMultiScale(gray, 1.2, 5)
        if len(faces) == 0: return None
        x,y,w,h = max(faces, key=lambda f:f[2]*f[3])
        crop = bgr[y:y+h, x:x+w]
        crop = cv2.resize(crop, (112,112))
        crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        crop = (crop.astype(np.float32) - 127.5) / 128.0
        chw = np.transpose(crop, (2,0,1))[None, ...]
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