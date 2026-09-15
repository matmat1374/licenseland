from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

class JobScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone=pytz.timezone("Asia/Tehran"))
        self.queue = []
        
    def start(self):
        self.scheduler.start()
        
    def add_job(self, func, trigger):
        return self.scheduler.add_job(func, trigger)
        
    def add_to_queue(self, task):
        self.queue.append(task)
        
    def get_queue(self):
        return self.queue
        
    def remove_from_queue(self, item_id: int):
        if 0 <= item_id < len(self.queue):
            return self.queue.pop(item_id)
        return None

scheduler_instance = JobScheduler()
