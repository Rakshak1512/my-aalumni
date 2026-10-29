import datetime
from typing import Dict, Any, List, Optional
from google.cloud.firestore import Query
from app.repositories.base_repository import BaseRepository
from app.utils.serializers import serialize_doc


class NotificationRepository(BaseRepository):
    def __init__(self):
        super().__init__('notifications')
        self.greetings_repo = BaseRepository('birthdayGreetings')

    def create_notification(self, recipient_id: str, notif_type: str, title: str, message: str, link: str = "") -> Dict[str, Any]:
        return self.create({
            "recipientId": recipient_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "link": link,
            "isRead": False,
            "readAt": None
        })

    def list_user_notifications(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        docs = self.collection.where('recipientId', '==', user_id).order_by('createdAt', direction=Query.DESCENDING).limit(limit).stream()
        return [serialize_doc(d) for d in docs]

    def get_unread_count(self, user_id: str) -> int:
        docs = self.collection.where('recipientId', '==', user_id).where('isRead', '==', False).stream()
        return sum(1 for _ in docs)

    def mark_as_read(self, notification_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        doc = self.get_by_id(notification_id)
        if not doc or doc.get('recipientId') != user_id:
            return None
        return self.update(notification_id, {
            "isRead": True,
            "readAt": datetime.datetime.now(datetime.timezone.utc)
        })

    def mark_all_as_read(self, user_id: str) -> int:
        docs = self.collection.where('recipientId', '==', user_id).where('isRead', '==', False).stream()
        count = 0
        now = datetime.datetime.now(datetime.timezone.utc)
        for d in docs:
            d.reference.update({"isRead": True, "readAt": now})
            count += 1
        return count

    # Birthday greetings
    def send_birthday_greeting(self, sender_id: str, sender_name: str, recipient_id: str, recipient_name: str, text: str) -> Dict[str, Any]:
        greeting = self.greetings_repo.create({
            "senderId": sender_id,
            "senderName": sender_name,
            "recipientId": recipient_id,
            "recipientName": recipient_name,
            "greetingText": text
        })
        # Also create notification for the recipient
        self.create_notification(
            recipient_id=recipient_id,
            notif_type="birthday_greeting",
            title=f"Birthday Greeting from {sender_name}!",
            message=text,
            link="/#/birthdays"
        )
        return greeting

    def list_received_greetings(self, recipient_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('birthdayGreetings').where('recipientId', '==', recipient_id).order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

