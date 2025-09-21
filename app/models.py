from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True)
    org_id = Column(String(64), nullable=False, default="default")
    code = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"))
    device_code = Column(String(128), unique=True, nullable=False)
    active = Column(Boolean, default=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String(64), default="default")
    branch_id = Column(Integer, ForeignKey("branches.id"))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    images = relationship("FaceImage", back_populates="user", cascade="all, delete-orphan")

class FaceImage(Base):
    __tablename__ = "face_images"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    filename = Column(String(255))
    image_bytes = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="images")