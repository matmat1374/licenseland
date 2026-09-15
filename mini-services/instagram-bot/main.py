from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from content import generate_post_content
from dm_bot import generate_dm_reply
from engagement import bot_instance
from scheduler import scheduler_instance

app = FastAPI(title="Instagram Bot API")

@app.on_event("startup")
def startup_event():
    scheduler_instance.start()

class PostRequest(BaseModel):
    product_name: str
    features: str
    image_url: str = None

class PublishRequest(BaseModel):
    caption: str
    image_path: str = "placeholder.jpg" # For now, a placeholder

class WebhookRequest(BaseModel):
    message: str
    sender_id: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/status")
def get_status():
    return {
        "bot_status": bot_instance.get_status(),
        "queue_count": len(scheduler_instance.get_queue()),
        "scheduler_running": scheduler_instance.scheduler.running
    }

@app.post("/generate-post")
def generate_post(request: PostRequest):
    caption = generate_post_content(request.product_name, request.features)
    return {"caption": caption}

@app.post("/post-now")
def post_now(request: PublishRequest):
    # In a real scenario we would download the image or use a valid path
    # For now, relying on mock mode if image doesn't exist
    success = bot_instance.publish_post(request.image_path, request.caption)
    if success:
        return {"status": "published"}
    raise HTTPException(status_code=500, detail="Failed to publish post")

@app.get("/queue")
def get_queue():
    return {"queue": scheduler_instance.get_queue()}

@app.delete("/queue/{item_id}")
def delete_from_queue(item_id: int):
    item = scheduler_instance.remove_from_queue(item_id)
    if item:
        return {"status": "deleted", "item": item}
    raise HTTPException(status_code=404, detail="Item not found")

@app.post("/dm-webhook")
def dm_webhook(request: WebhookRequest):
    reply = generate_dm_reply(request.message)
    # Log or send reply
    return {"reply": reply}

@app.get("/analytics")
def get_analytics():
    return {
        "followers": 12500 if bot_instance.mock_mode else 0, # Mock data
        "impressions": 45000,
        "posts_published": 120,
        "dms_replied": 350
    }

@app.post("/settings")
def update_settings(settings: dict):
    # Stub for updating settings
    return {"status": "updated", "settings": settings}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
