import os
import time
import random
from instagrapi import Client

class EngagementBot:
    def __init__(self):
        self.client = Client()
        self.is_logged_in = False
        self.mock_mode = os.getenv("INSTAGRAM_MOCK_MODE", "true").lower() == "true"
        self.username = os.getenv("INSTAGRAM_USERNAME")
        self.password = os.getenv("INSTAGRAM_PASSWORD")
        
        if not self.mock_mode and self.username and self.password:
            try:
                self.client.login(self.username, self.password)
                self.is_logged_in = True
                print("Successfully logged into Instagram.")
            except Exception as e:
                print(f"Failed to login to Instagram: {e}")
                self.mock_mode = True
        else:
            print("Running in MOCK mode (no credentials or mock forced).")

    def sleep_random(self, min_sec=2, max_sec=5):
        time.sleep(random.uniform(min_sec, max_sec))

    def publish_post(self, image_path: str, caption: str) -> bool:
        if self.mock_mode:
            print(f"[MOCK] Publishing post: {caption[:30]}...")
            self.sleep_random(1, 2)
            return True
            
        try:
            self.client.photo_upload(image_path, caption)
            self.sleep_random(5, 10)
            return True
        except Exception as e:
            print(f"Error publishing post: {e}")
            return False

    def get_status(self) -> dict:
        return {
            "is_logged_in": self.is_logged_in,
            "mock_mode": self.mock_mode,
            "username": self.username
        }

bot_instance = EngagementBot()
