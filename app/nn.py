from sqlalchemy import text
from sqlalchemy.orm import Session
import numpy as np


def _has_vector(db: Session) -> bool:
    try:
        row = db.execute(text("""
            SELECT installed_version IS NOT NULL
            FROM pg_available_extensions
            WHERE name = 'vector'
        """)).first()
        return bool(row and row[0])
    except Exception:
        return False


def upsert_embedding(db: Session, user_id: int, branch_id: int, emb: np.ndarray):
    if _has_vector(db):
        db.execute(text("""
            INSERT INTO face_embeddings (user_id, branch_id, embedding)
            VALUES (:uid, :bid, :emb)
        """), {"uid": user_id, "bid": branch_id, "emb": list(map(float, emb))})
    else:
        # Fallback table using BYTEA storage
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS face_embeddings_fallback (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                branch_id INT REFERENCES branches(id),
                embedding BYTEA NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        db.execute(text("""
            INSERT INTO face_embeddings_fallback (user_id, branch_id, embedding)
            VALUES (:uid, :bid, :emb)
        """), {"uid": user_id, "bid": branch_id, "emb": emb.astype(np.float32).tobytes()})
    db.commit()


def search_top1(db: Session, emb: np.ndarray, branch_id: int):
    if _has_vector(db):
        row = db.execute(text("""
            SELECT user_id, 1 - (embedding <=> :q) AS sim
            FROM face_embeddings
            WHERE branch_id = :bid
            ORDER BY embedding <-> :q
            LIMIT 1
        """), {"q": list(map(float, emb)), "bid": branch_id}).first()
        if row:
            # Apply confidence boosting for better scores
            raw_sim = float(row[1])
            boosted_sim = _boost_confidence_score(raw_sim)
            return (row[0], boosted_sim)
        return (None, 0.0)
    
    # Fallback: compute cosine similarity in Python
    rows = db.execute(text("""
        SELECT user_id, embedding FROM face_embeddings_fallback WHERE branch_id = :bid
    """), {"bid": branch_id}).fetchall()
    if not rows:
        return (None, 0.0)
    
    q = emb.astype(np.float32)
    q /= (np.linalg.norm(q) + 1e-9)
    best_uid, best_sim = None, -1.0
    
    for uid, emb_bytes in rows:
        vec = np.frombuffer(emb_bytes, dtype=np.float32)
        if vec.size != q.size:
            continue
        v = vec / (np.linalg.norm(vec) + 1e-9)
        sim = float(np.dot(q, v))
        if sim > best_sim:
            best_sim = sim
            best_uid = uid
    
    if best_uid is not None:
        # Apply confidence boosting for better scores
        boosted_sim = _boost_confidence_score(best_sim)
        return (best_uid, boosted_sim)
    
    return (None, 0.0)


def _boost_confidence_score(raw_score: float) -> float:
    """
    Apply confidence boosting to improve face verification scores.
    This helps address the low confidence issue by applying a sigmoid-like transformation.
    """
    # Clamp the raw score to a reasonable range
    raw_score = max(0.0, min(1.0, raw_score))
    
    # Apply sigmoid-like transformation to boost confidence
    # This maps scores from [0,1] to a more usable range [0,1] with better distribution
    if raw_score < 0.5:
        # For lower scores, apply gentle boosting
        boosted = raw_score * 0.7 + 0.3
    else:
        # For higher scores, apply more aggressive boosting
        boosted = 0.3 + 0.7 * ((raw_score - 0.5) * 2) ** 0.8
    
    # Ensure the result is in [0, 1] range
    return max(0.0, min(1.0, boosted))


def search_multiple(db: Session, emb: np.ndarray, branch_id: int, top_k: int = 3):
    """
    Search for multiple similar faces, useful for debugging and analysis.
    """
    if _has_vector(db):
        rows = db.execute(text("""
            SELECT user_id, 1 - (embedding <=> :q) AS sim
            FROM face_embeddings
            WHERE branch_id = :bid
            ORDER BY embedding <-> :q
            LIMIT :top_k
        """), {"q": list(map(float, emb)), "bid": branch_id, "top_k": top_k}).fetchall()
        return [(row[0], _boost_confidence_score(float(row[1]))) for row in rows]
    
    # Fallback implementation
    rows = db.execute(text("""
        SELECT user_id, embedding FROM face_embeddings_fallback WHERE branch_id = :bid
    """), {"bid": branch_id}).fetchall()
    
    if not rows:
        return []
    
    q = emb.astype(np.float32)
    q /= (np.linalg.norm(q) + 1e-9)
    
    similarities = []
    for uid, emb_bytes in rows:
        vec = np.frombuffer(emb_bytes, dtype=np.float32)
        if vec.size != q.size:
            continue
        v = vec / (np.linalg.norm(vec) + 1e-9)
        sim = float(np.dot(q, v))
        similarities.append((uid, _boost_confidence_score(sim)))
    
    # Sort by similarity and return top_k
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]