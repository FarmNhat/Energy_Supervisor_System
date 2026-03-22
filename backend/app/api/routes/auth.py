from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import hash_password, verify_password
from ...repositories import UserRepository
from ...schemas import LoginResponse, UserCreate, UserLogin, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    user_repo = UserRepository(db)
    existing_user = user_repo.get_by_username(payload.username)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user = user_repo.create(payload.username, hash_password(payload.password))
    return UserRead.model_validate(user)


@router.post("/login", response_model=LoginResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> LoginResponse:
    user_repo = UserRepository(db)
    user = user_repo.get_by_username(payload.username)

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return LoginResponse(access_token=f"mock-token-{user.user_id}", user=UserRead.model_validate(user))
