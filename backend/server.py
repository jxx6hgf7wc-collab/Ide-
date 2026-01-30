from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'spark-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============== Models ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    theme: str = "light"
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class QueryRequest(BaseModel):
    category: str
    prompt: str

class SuggestionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    category: str
    prompt: str
    suggestion: str
    created_at: str

class FavoriteCreate(BaseModel):
    category: str
    prompt: str
    suggestion: str

class FavoriteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    category: str
    prompt: str
    suggestion: str
    created_at: str

class ThemeUpdate(BaseModel):
    theme: str

# ============== My Ideas Models ==============

class IdeaCreate(BaseModel):
    title: str
    content: Optional[str] = None
    idea_type: str  # note, idea, photo, video, link
    media_url: Optional[str] = None
    tags: Optional[List[str]] = []

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class IdeaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    content: Optional[str] = None
    idea_type: str
    media_url: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    share_id: Optional[str] = None
    author_name: Optional[str] = None
    created_at: str
    updated_at: str

class SharedIdeaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: Optional[str] = None
    idea_type: str
    media_url: Optional[str] = None
    author_name: str
    created_at: str

# ============== Auth Helpers ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== Content Moderation ==============

# Blocked terms for NSFW and religious hate content
BLOCKED_PATTERNS = [
    # NSFW terms
    "porn", "xxx", "nude", "naked", "sex", "erotic", "fetish", "hentai",
    "nsfw", "adult content", "explicit", "sexually", "genitals", "orgasm",
    "masturbat", "intercourse", "prostitut", "escort service",
    
    # Religious hate/discrimination
    "kill all", "death to", "exterminate", "genocide",
    "hate muslims", "hate christians", "hate jews", "hate hindus", "hate buddhists",
    "anti-muslim", "anti-christian", "anti-jewish", "anti-semit", "anti-hindu",
    "islamophob", "antisemit", "religous hate", "religious hate",
    "burn the quran", "burn the bible", "burn the torah",
    "terrorist religion", "evil religion", "false religion",
    
    # General hate speech
    "racial slur", "n word", "hate speech", "white supremac", "nazi",
    "ethnic cleansing", "hate crime", "lynch", "slaughter people"
]

def check_content_moderation(text: str) -> tuple[bool, str]:
    """
    Check if text contains blocked content.
    Returns (is_blocked, reason) tuple.
    """
    text_lower = text.lower()
    
    for pattern in BLOCKED_PATTERNS:
        if pattern in text_lower:
            return True, f"Content blocked: Your query contains inappropriate content. Please keep requests creative and respectful."
    
    return False, ""

# ============== Category Prompts ==============

CATEGORY_PROMPTS = {
    "writing": """You are a creative writing assistant helping someone overcome writer's block. 
Generate unique, inspiring writing prompts and story ideas. Be specific and imaginative.
Provide 3 distinct creative suggestions based on the user's input.""",
    
    "design": """You are a design inspiration expert. Help users find creative visual concepts, 
color palettes, layout ideas, and aesthetic directions. Be specific about visual elements.
Provide 3 distinct creative design suggestions based on the user's input.""",
    
    "problem-solving": """You are a creative problem-solving consultant. Help users think outside 
the box and find innovative solutions. Use lateral thinking and unconventional approaches.
Provide 3 distinct creative solutions based on the user's input.""",
    
    "gift-ideas": """You are a thoughtful gift curator. Suggest unique, personalized gift ideas 
that go beyond typical suggestions. Consider the recipient's interests and the occasion.
Provide 3 distinct creative gift suggestions based on the user's input.""",
    
    "project-names": """You are a naming expert and branding specialist. Generate memorable, 
creative names for projects, businesses, products, or creative works.
Provide 5 distinct creative name suggestions based on the user's input.""",
    
    "content-ideas": """You are a content strategist and creative director. Generate engaging 
content ideas for blogs, social media, videos, or other creative platforms.
Provide 3 distinct creative content suggestions based on the user's input."""
}

# ============== Routes ==============

@api_router.get("/")
async def root():
    return {"message": "Ideæ API - Creative Assistant"}

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "theme": "light",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=data.email,
        name=data.name,
        theme="light",
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        theme=user.get("theme", "light"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        theme=current_user.get("theme", "light"),
        created_at=current_user["created_at"]
    )

# Settings Routes
@api_router.put("/settings/theme", response_model=UserResponse)
async def update_theme(data: ThemeUpdate, current_user: dict = Depends(get_current_user)):
    if data.theme not in ["light", "dark"]:
        raise HTTPException(status_code=400, detail="Invalid theme")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"theme": data.theme}}
    )
    
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        theme=data.theme,
        created_at=current_user["created_at"]
    )

# AI Creative Routes
@api_router.post("/creative/generate", response_model=SuggestionResponse)
async def generate_suggestion(data: QueryRequest, current_user: dict = Depends(get_current_user)):
    if data.category not in CATEGORY_PROMPTS:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Content moderation check
    is_blocked, block_reason = check_content_moderation(data.prompt)
    if is_blocked:
        raise HTTPException(status_code=400, detail=block_reason)
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    system_prompt = CATEGORY_PROMPTS[data.category]
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"spark-{current_user['id']}-{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=data.prompt)
        response = await chat.send_message(user_message)
        
        suggestion_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        
        # Save query history
        query_doc = {
            "id": suggestion_id,
            "user_id": current_user["id"],
            "category": data.category,
            "prompt": data.prompt,
            "suggestion": response,
            "created_at": created_at
        }
        await db.queries.insert_one(query_doc)
        
        return SuggestionResponse(
            id=suggestion_id,
            category=data.category,
            prompt=data.prompt,
            suggestion=response,
            created_at=created_at
        )
    except Exception as e:
        logging.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestion")

@api_router.get("/creative/history", response_model=List[SuggestionResponse])
async def get_history(current_user: dict = Depends(get_current_user)):
    queries = await db.queries.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return [SuggestionResponse(**q) for q in queries]

# Favorites Routes
@api_router.post("/favorites", response_model=FavoriteResponse)
async def add_favorite(data: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    favorite_id = str(uuid.uuid4())
    favorite_doc = {
        "id": favorite_id,
        "user_id": current_user["id"],
        "category": data.category,
        "prompt": data.prompt,
        "suggestion": data.suggestion,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favorites.insert_one(favorite_doc)
    
    return FavoriteResponse(**favorite_doc)

@api_router.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [FavoriteResponse(**f) for f in favorites]

@api_router.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "id": favorite_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Favorite deleted"}

class FavoriteUpdate(BaseModel):
    suggestion: str

@api_router.put("/favorites/{favorite_id}", response_model=FavoriteResponse)
async def update_favorite(favorite_id: str, data: FavoriteUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.update_one(
        {"id": favorite_id, "user_id": current_user["id"]},
        {"$set": {"suggestion": data.suggestion}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    favorite = await db.favorites.find_one({"id": favorite_id}, {"_id": 0})
    return FavoriteResponse(**favorite)

# ============== My Ideas Routes ==============

@api_router.post("/ideas", response_model=IdeaResponse)
async def create_idea(data: IdeaCreate, current_user: dict = Depends(get_current_user)):
    idea_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    idea_doc = {
        "id": idea_id,
        "user_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "idea_type": data.idea_type,
        "media_url": data.media_url,
        "tags": data.tags or [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.ideas.insert_one(idea_doc)
    
    return IdeaResponse(**idea_doc)

@api_router.get("/ideas", response_model=List[IdeaResponse])
async def get_ideas(
    idea_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if idea_type:
        query["idea_type"] = idea_type
    
    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [IdeaResponse(**i) for i in ideas]

@api_router.get("/ideas/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one(
        {"id": idea_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    return IdeaResponse(**idea)

@api_router.put("/ideas/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, data: IdeaUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.title is not None:
        update_data["title"] = data.title
    if data.content is not None:
        update_data["content"] = data.content
    if data.tags is not None:
        update_data["tags"] = data.tags
    
    result = await db.ideas.update_one(
        {"id": idea_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    return IdeaResponse(**idea)

@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.ideas.delete_one({
        "id": idea_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    return {"message": "Idea deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
