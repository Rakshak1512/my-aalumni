import datetime
from typing import Dict, Any, List, Optional
from app.repositories.base_repository import BaseRepository
from app.utils.serializers import serialize_doc


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__('users')

    def get_user_with_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_id(user_id)
        if not user:
            return None

        role = user.get('role', '').lower()
        profile_collection = None
        if role == 'student':
            profile_collection = 'studentProfiles'
        elif role == 'alumni':
            profile_collection = 'alumniProfiles'
        elif role == 'faculty':
            profile_collection = 'facultyProfiles'

        if profile_collection:
            p_doc = self.db.collection(profile_collection).document(user_id).get()
            if p_doc.exists:
                user['profile'] = serialize_doc(p_doc)
            else:
                user['profile'] = {}
        else:
            user['profile'] = {}

        return user

    def update_role_profile(self, user_id: str, role: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        coll_name = f"{role.lower()}Profiles"
        doc_ref = self.db.collection(coll_name).document(user_id)
        now = datetime.datetime.now(datetime.timezone.utc)
        payload = {**profile_data, "userId": user_id, "updatedAt": now}
        
        if doc_ref.get().exists:
            doc_ref.update(payload)
        else:
            payload["createdAt"] = now
            doc_ref.set(payload)
            
        return serialize_doc(doc_ref.get())

    def search_alumni(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        query = self.collection.where('role', '==', 'alumni').where('accountStatus', '==', 'active')
        users = [serialize_doc(d) for d in query.stream()]
        results = []

        q_name = (query_params.get('name') or '').lower()
        q_course = (query_params.get('courseId') or '').lower()
        q_year = query_params.get('graduationYear')
        q_company = (query_params.get('company') or '').lower()
        q_role = (query_params.get('jobTitle') or '').lower()
        q_skills = (query_params.get('skills') or '').lower()
        q_mentoring = query_params.get('isMentoringAvailable')

        for u in users:
            uid = u['id']
            p_doc = self.db.collection('alumniProfiles').document(uid).get()
            profile = serialize_doc(p_doc) if p_doc.exists else {}
            u['profile'] = profile

            if q_name and q_name not in (u.get('displayName') or '').lower():
                continue
            if q_course and q_course != (profile.get('courseId') or '').lower() and q_course not in (profile.get('courseName') or '').lower():
                continue
            if q_year and str(q_year) != str(profile.get('graduationYear', '')):
                continue
            if q_company and q_company not in (profile.get('company') or '').lower():
                continue
            if q_role and q_role not in (profile.get('jobTitle') or '').lower():
                continue
            if q_mentoring is not None:
                is_mentor = profile.get('isMentoringAvailable', False)
                if str(q_mentoring).lower() in ('true', '1') and not is_mentor:
                    continue
                elif str(q_mentoring).lower() in ('false', '0') and is_mentor:
                    continue
            if q_skills:
                skills_list = [str(s).lower() for s in profile.get('skills', [])]
                if not any(q_skills in s for s in skills_list):
                    continue

            results.append(u)

        return results

    def get_birthdays(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Retrieves today's and upcoming birthdays of alumni whose birthday privacy allows it.
        Excludes birth years for privacy.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        current_month = now.month
        current_day = now.day

        # Get all alumni profiles with public birthday
        alumni_docs = self.db.collection('alumniProfiles').stream()
        today_birthdays = []
        upcoming_birthdays = []

        for p in alumni_docs:
            p_data = serialize_doc(p)
            bday = p_data.get('birthday')
            if not bday or not bday.get('isPublic', True):
                continue

            m = bday.get('month')
            d = bday.get('day')
            if not m or not d:
                continue

            # Fetch basic user info
            u_doc = self.db.collection('users').document(p.id).get()
            if not u_doc.exists:
                continue
            u_data = serialize_doc(u_doc)
            if u_data.get('accountStatus') != 'active':
                continue

            item = {
                "userId": p.id,
                "displayName": u_data.get('displayName', 'Alumnus'),
                "avatarUrl": u_data.get('avatarUrl', ''),
                "company": p_data.get('company', ''),
                "jobTitle": p_data.get('jobTitle', ''),
                "courseName": p_data.get('courseName', ''),
                "graduationYear": p_data.get('graduationYear', ''),
                "month": m,
                "day": d
            }

            if m == current_month and d == current_day:
                today_birthdays.append(item)
            elif (m == current_month and d > current_day) or (m == (current_month % 12) + 1 and d <= 15):
                upcoming_birthdays.append(item)

        # Sort upcoming by date
        upcoming_birthdays.sort(key=lambda x: (x['month'], x['day']))

        return {
            "today": today_birthdays,
            "upcoming": upcoming_birthdays
        }

