from pydantic import BaseModel

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
