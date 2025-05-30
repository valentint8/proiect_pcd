from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import get_password_hash, verify_password

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if user and verify_password(password, user.hashed_password):
        return user
    return None

def change_user_password(db: Session, user_id: str, current_password: str, new_password: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not verify_password(current_password, user.hashed_password):
        return None
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user
