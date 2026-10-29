from flask import Blueprint, request, g
from app.auth.decorators import require_auth
from app.repositories.community_repository import CommunityRepository
from app.utils.responses import success_response, error_response

batch_bp = Blueprint('batches', __name__)
community_repo = CommunityRepository()


@batch_bp.route('/batches', methods=['GET'])
@require_auth
def list_batches():
    """Lists all available batch communities."""
    batches = community_repo.list_all()
    return success_response(batches, message="Batches retrieved.")


@batch_bp.route('/batches/my', methods=['GET'])
@require_auth
def list_my_batches():
    """Lists batches the authenticated user is a verified member of."""
    user_id = g.current_user['uid']
    my_batches = community_repo.get_user_batches(user_id)
    return success_response(my_batches, message="User batches retrieved.")


@batch_bp.route('/batches/<batch_id>/join', methods=['POST'])
@require_auth
def join_batch(batch_id: str):
    """Enrolls current user in a course/year batch community."""
    current = g.current_user
    batch = community_repo.get_by_id(batch_id)
    if not batch:
        return error_response("Batch not found.", "NOT_FOUND", 404)

    res = community_repo.add_user_to_batch(
        batch_id=batch_id,
        user_id=current['uid'],
        user_name=current.get('displayName', 'User'),
        role=current.get('role', 'student')
    )
    return success_response(res, message="Joined batch community successfully.")


@batch_bp.route('/batches/<batch_id>/members', methods=['GET'])
@require_auth
def list_batch_members(batch_id: str):
    """Member directory of a batch."""
    members = community_repo.list_batch_members(batch_id)
    return success_response(members, message="Batch members retrieved.")


@batch_bp.route('/batches/<batch_id>/posts', methods=['GET'])
@require_auth
def list_batch_posts(batch_id: str):
    """Community posts within a batch."""
    posts = community_repo.list_batch_posts(batch_id)
    return success_response(posts, message="Batch posts retrieved.")


@batch_bp.route('/batches/<batch_id>/posts', methods=['POST'])
@require_auth
def create_batch_post(batch_id: str):
    """Publishes a new discussion post or reunion idea to the batch."""
    current = g.current_user
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return error_response("Title and content are required.", "BAD_REQUEST", 400)

    post = community_repo.create_batch_post(
        batch_id=batch_id,
        author_id=current['uid'],
        author_name=current.get('displayName', 'User'),
        author_role=current.get('role', 'alumni'),
        title=title,
        content=content
    )
    return success_response(post, message="Post published to batch community.", status_code=201)


@batch_bp.route('/batches/posts/<post_id>/comments', methods=['GET'])
@require_auth
def list_post_comments(post_id: str):
    """Retrieves comments on a batch post."""
    comments = community_repo.list_post_comments(post_id)
    return success_response(comments, message="Comments retrieved.")


@batch_bp.route('/batches/posts/<post_id>/comments', methods=['POST'])
@require_auth
def add_comment(post_id: str):
    """Adds a comment to a batch discussion post."""
    current = g.current_user
    data = request.get_json() or {}
    content = data.get('content', '').strip()

    if not content:
        return error_response("Comment content cannot be empty.", "BAD_REQUEST", 400)

    comment = community_repo.create_comment(
        post_id=post_id,
        author_id=current['uid'],
        author_name=current.get('displayName', 'User'),
        content=content
    )
    return success_response(comment, message="Comment added.", status_code=201)

