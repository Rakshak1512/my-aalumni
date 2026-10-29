from flask import Blueprint, request, g
from app.auth.decorators import require_auth
from app.repositories.user_repository import UserRepository
from app.repositories.notification_repository import NotificationRepository
from app.utils.responses import success_response, error_response

birthday_bp = Blueprint('birthdays', __name__)
user_repo = UserRepository()
notif_repo = NotificationRepository()


@birthday_bp.route('/birthdays', methods=['GET'])
@require_auth
def get_birthdays():
    """Lists today's and upcoming birthdays with strict privacy enforcement (no birth years)."""
    birthdays = user_repo.get_birthdays()
    return success_response(birthdays, message="Birthdays retrieved.")


@birthday_bp.route('/birthdays/greet', methods=['POST'])
@require_auth
def send_greeting():
    """Sends a birthday greeting message to an alumnus celebrating their birthday."""
    current = g.current_user
    sender_id = current['uid']
    data = request.get_json() or {}
    recipient_id = data.get('recipientId')
    greeting_text = data.get('greetingText', 'Wishing you a very happy birthday and great success in your career!').strip()

    if not recipient_id:
        return error_response("Field 'recipientId' is required.", "BAD_REQUEST", 400)

    if recipient_id == sender_id:
        return error_response("You cannot send a birthday greeting to yourself.", "BAD_REQUEST", 400)

    recipient = user_repo.get_by_id(recipient_id)
    if not recipient:
        return error_response("Recipient not found.", "NOT_FOUND", 404)

    greeting = notif_repo.send_birthday_greeting(
        sender_id=sender_id,
        sender_name=current.get('displayName', 'Peer'),
        recipient_id=recipient_id,
        recipient_name=recipient.get('displayName', 'Alumnus'),
        text=greeting_text
    )

    return success_response(greeting, message="Birthday greeting sent successfully.", status_code=201)


@birthday_bp.route('/birthdays/my-greetings', methods=['GET'])
@require_auth
def list_my_greetings():
    """Lists birthday greetings received by the current user."""
    user_id = g.current_user['uid']
    greetings = notif_repo.list_received_greetings(user_id)
    return success_response(greetings, message="Received greetings retrieved.")

