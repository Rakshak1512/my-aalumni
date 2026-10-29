import datetime
from typing import Dict, Any, List, Optional
from google.cloud.firestore import Query
from app.repositories.base_repository import BaseRepository
from app.utils.serializers import serialize_doc


class CommunityRepository(BaseRepository):
    def __init__(self):
        super().__init__('batches')
        self.members_repo = BaseRepository('batchMembers')
        self.posts_repo = BaseRepository('communityPosts')
        self.comments_repo = BaseRepository('communityComments')

    def get_user_batches(self, user_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('batchMembers').where('userId', '==', user_id).stream()
        memberships = [serialize_doc(d) for d in docs]
        batches = []
        for m in memberships:
            b = self.get_by_id(m['batchId'])
            if b:
                batches.append({**b, "membershipRole": m.get('role', 'member')})
        return batches

    def is_user_in_batch(self, user_id: str, batch_id: str) -> bool:
        db = self.db
        docs = db.collection('batchMembers').where('batchId', '==', batch_id).where('userId', '==', user_id).stream()
        for _ in docs:
            return True
        return False

    def add_user_to_batch(self, batch_id: str, user_id: str, user_name: str, role: str = 'member') -> Dict[str, Any]:
        if self.is_user_in_batch(user_id, batch_id):
            return {"message": "User is already a member of this batch."}
        return self.members_repo.create({
            "batchId": batch_id,
            "userId": user_id,
            "userName": user_name,
            "role": role,
            "joinedAt": datetime.datetime.now(datetime.timezone.utc)
        })

    def list_batch_members(self, batch_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('batchMembers').where('batchId', '==', batch_id).stream()
        return [serialize_doc(d) for d in docs]

    def list_batch_posts(self, batch_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('communityPosts').where('batchId', '==', batch_id).order_by('createdAt', direction=Query.DESCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def create_batch_post(self, batch_id: str, author_id: str, author_name: str, author_role: str, title: str, content: str) -> Dict[str, Any]:
        return self.posts_repo.create({
            "batchId": batch_id,
            "authorId": author_id,
            "authorName": author_name,
            "authorRole": author_role,
            "title": title,
            "content": content,
            "likesCount": 0
        })

    def list_post_comments(self, post_id: str) -> List[Dict[str, Any]]:
        db = self.db
        docs = db.collection('communityComments').where('postId', '==', post_id).order_by('createdAt', direction=Query.ASCENDING).stream()
        return [serialize_doc(d) for d in docs]

    def create_comment(self, post_id: str, author_id: str, author_name: str, content: str) -> Dict[str, Any]:
        return self.comments_repo.create({
            "postId": post_id,
            "authorId": author_id,
            "authorName": author_name,
            "content": content
        })

