import datetime
from typing import Dict, Any, List, Optional
from google.cloud.firestore import Query
from app.repositories.base_repository import BaseRepository
from app.utils.serializers import serialize_doc


class OpportunityRepository(BaseRepository):
    def __init__(self):
        super().__init__('opportunities')
        self.saved_repo = BaseRepository('savedOpportunities')
        self.apps_repo = BaseRepository('applications')

    def list_approved(self) -> List[Dict[str, Any]]:
        docs = self.collection.where('status', '==', 'approved').order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def list_pending(self) -> List[Dict[str, Any]]:
        docs = self.collection.where('status', '==', 'pending').order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def list_by_author(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self.collection.where('postedByUserId', '==', user_id).order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    # Saved opportunities
    def toggle_save_opportunity(self, user_id: str, opportunity_id: str) -> bool:
        db = self.db
        docs = db.collection('savedOpportunities').where('userId', '==', user_id).where('opportunityId', '==', opportunity_id).stream()
        found = False
        for d in docs:
            d.reference.delete()
            found = True
        if not found:
            self.saved_repo.create({"userId": user_id, "opportunityId": opportunity_id})
            return True
        return False

    def list_saved_opportunities(self, user_id: str) -> List[Dict[str, Any]]:
        db = self.db
        saved = [serialize_doc(d) for d in db.collection('savedOpportunities').where('userId', '==', user_id).stream()]
        opp_ids = [s['opportunityId'] for s in saved if 'opportunityId' in s]
        results = []
        for oid in opp_ids:
            opp = self.get_by_id(oid)
            if opp:
                results.append(opp)
        return results

    # Applications tracker
    def get_user_applications(self, user_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('applications').where('userId', '==', user_id).order_by('updatedAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def track_application(self, user_id: str, opportunity_id: str, opp_title: str, company: str, status: str, notes: str = "") -> Dict[str, Any]:
        db = self.db
        existing = db.collection('applications').where('userId', '==', user_id).where('opportunityId', '==', opportunity_id).stream()
        for d in existing:
            # Update existing
            d.reference.update({
                "status": status,
                "notes": notes,
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            })
            return serialize_doc(d.reference.get())

        # Create new tracker item
        return self.apps_repo.create({
            "userId": user_id,
            "opportunityId": opportunity_id,
            "opportunityTitle": opp_title,
            "company": company,
            "status": status,
            "notes": notes,
            "appliedDate": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

