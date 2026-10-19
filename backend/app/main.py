import hashlib
import hmac
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "selenium_test_lab")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
DEMO_EMAIL = "admin@example.com"
DEMO_PASSWORD = "Selenium123!"


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    salt_hex, digest_hex = stored_hash.split(":", maxsplit=1)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 120_000
    )
    return hmac.compare_digest(candidate.hex(), digest_hex)


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        app.state.mongo_client = client
        app.state.database = client[MONGODB_DATABASE]

        await app.state.database.users.create_index("email", unique=True)
        await app.state.database.users.update_one(
            {"email": DEMO_EMAIL},
            {
                "$setOnInsert": {
                    "email": DEMO_EMAIL,
                    "name": "Demo Admin",
                    "password_hash": hash_password(DEMO_PASSWORD),
                }
            },
            upsert=True,
        )
        await app.state.database.products.create_index("created_at")
        yield
    finally:
        client.close()


app = FastAPI(title="Selenium Test Lab API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=40)
    description: str = Field(min_length=5, max_length=500)
    price: float = Field(gt=0, le=1_000_000_000)


def serialize_product(document: dict[str, Any]) -> dict[str, Any]:
    created_at = document["created_at"]
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "category": document["category"],
        "description": document["description"],
        "price": float(document["price"]),
        "created_at": created_at.isoformat(),
    }


@app.get("/", include_in_schema=False)
async def api_home() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/api/health")
async def health(request: Request) -> dict[str, str]:
    await request.app.state.mongo_client.admin.command("ping")
    return {"status": "ok"}


@app.post("/api/auth/login")
async def login(payload: LoginRequest, request: Request) -> dict[str, Any]:
    user = await request.app.state.database.users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return {"user": {"name": user["name"], "email": user["email"]}}


@app.get("/api/products")
async def list_products(request: Request) -> list[dict[str, Any]]:
    cursor = request.app.state.database.products.find().sort("created_at", -1)
    return [serialize_product(document) async for document in cursor]


@app.post("/api/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate, request: Request
) -> dict[str, Any]:
    document = payload.model_dump()
    document["created_at"] = datetime.now(timezone.utc)
    result = await request.app.state.database.products.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_product(document)


@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, request: Request) -> None:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    result = await request.app.state.database.products.delete_one(
        {"_id": ObjectId(product_id)}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
