from flask import Blueprint, request, jsonify
from database.db import get_db
from middleware.auth import login_required

bp = Blueprint('notifications', __name__, url_prefix='/api')

@bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications(user_id):
    """Получение уведомлений пользователя"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    notifications = cursor.fetchall()
    conn.close()
    return jsonify([{
        'id': n['id'],
        'title': n['title'],
        'message': n['message'],
        'read': bool(n['is_read']),
        'date': n['created_at']
    } for n in notifications])

@bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(user_id, notif_id):
    """Отметить уведомление как прочитанное"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notif_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@bp.route('/settings/notifications', methods=['GET'])
@login_required
def get_notifications_settings(user_id):
    """Получение настроек уведомлений"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT notifications_enabled FROM settings WHERE user_id = ?", (user_id,))
    setting = cursor.fetchone()
    conn.close()
    return jsonify({'enabled': bool(setting['notifications_enabled']) if setting else True})

@bp.route('/settings/notifications', methods=['PUT'])
@login_required
def update_notifications_settings(user_id):
    """Обновление настроек уведомлений"""
    data = request.json
    enabled = data.get('enabled', True)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE settings SET notifications_enabled = ? WHERE user_id = ?", (1 if enabled else 0, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})