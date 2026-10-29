import datetime
from typing import Dict, Any, List, Optional
from google.cloud.firestore import Query
from app.repositories.base_repository import BaseRepository
from app.utils.serializers import serialize_doc


class EventRepository(BaseRepository):
    def __init__(self):
        super().__init__('events')
        self.reg_repo = BaseRepository('eventRegistrations')

    def list_approved_events(self) -> List[Dict[str, Any]]:
        docs = self.collection.where('status', '==', 'approved').order_by('startDate', direction=Query.ASCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def list_pending_events(self) -> List[Dict[str, Any]]:
        docs = self.collection.where('status', '==', 'pending').order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def register_for_event(self, event_id: str, user_id: str, user_name: str, user_email: str, user_role: str) -> Dict[str, Any]:
        event_doc = self.collection.document(event_id).get()
        if not event_doc.exists:
            raise ValueError("Event does not exist.")
        
        event_data = serialize_doc(event_doc)
        if event_data.get('status') != 'approved':
            raise ValueError("Cannot register for an unapproved event.")

        # Check existing registration
        db = self.db
        existing = db.collection('eventRegistrations').where('eventId', '==', event_id).where('userId', '==', user_id).where('status', '==', 'confirmed').stream()
        for _ in existing:
            raise ValueError("You are already registered for this event.")

        # Check capacity
        capacity = event_data.get('capacity')
        reg_count = event_data.get('registeredCount', 0)
        if capacity and reg_count >= capacity:
            raise ValueError("Event is at full capacity.")

        # Check deadline
        deadline = event_data.get('registrationDeadline')
        if deadline:
            try:
                deadline_dt = datetime.datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                if datetime.datetime.now(datetime.timezone.utc) > deadline_dt:
                    raise ValueError("Registration deadline has passed.")
            except Exception:
                pass

        reg = self.reg_repo.create({
            "eventId": event_id,
            "userId": user_id,
            "userName": user_name,
            "userEmail": user_email,
            "userRole": user_role,
            "status": "confirmed",
            "registeredAt": datetime.datetime.now(datetime.timezone.utc)
        })

        # Increment count
        self.collection.document(event_id).update({
            "registeredCount": reg_count + 1,
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        })

        return reg

    def cancel_registration(self, event_id: str, user_id: str) -> bool:
        db = self.db
        existing = db.collection('eventRegistrations').where('eventId', '==', event_id).where('userId', '==', user_id).where('status', '==', 'confirmed').stream()
        found = False
        for d in existing:
            d.reference.update({"status": "cancelled", "cancelledAt": datetime.datetime.now(datetime.timezone.utc)})
            found = True

        if found:
            event_doc = self.collection.document(event_id).get()
            if event_doc.exists:
                c = max(0, event_doc.to_dict().get('registeredCount', 1) - 1)
                self.collection.document(event_id).update({"registeredCount": c})

        return found

    def list_user_registrations(self, user_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('eventRegistrations').where('userId', '==', user_id).where('status', '==', 'confirmed').stream()
        regs = [serialize_doc(d) for d in docs]
        results = []
        for r in regs:
            evt = self.get_by_id(r['eventId'])
            if evt:
                results.append({**evt, "registrationId": r['id'], "registeredAt": r.get('registeredAt')})
        return results

    def list_attendees(self, event_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('eventRegistrations').where('eventId', '==', event_id).where('status', '==', 'confirmed').stream()
        return [serialize_doc(d) for d in docs]

