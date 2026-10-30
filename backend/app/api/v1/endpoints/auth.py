from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found in database.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account.")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user or not user.is_active:
        return None
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new research collaborator."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already registered.")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "Researcher",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates researcher and issues JWT access token."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password.")

    token = create_access_token({"sub": user.email, "role": user.role, "name": user.full_name})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login for Swagger UI."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password.")

    token = create_access_token({"sub": user.email, "role": user.role, "name": user.full_name})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: Optional[User] = Depends(get_current_user)):
    """Returns the authenticated researcher's profile."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists research project collaborators (authenticated only)."""
    return db.query(User).all()

