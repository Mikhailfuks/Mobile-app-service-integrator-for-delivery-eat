from flask import Blueprint, request, jsonify
from database.db import get_db
from middleware.auth import login_required

bp = Blueprint('reviews', __name__, url_prefix='/api')

@bp.route('/reviews', methods=['GET'])
def get_reviews():
    """Получение списка отзывов"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''SELECT r.id, r.rating, r.text, r.created_at, r.order_number,
                             u.name, u.surname, u.avatar
                      FROM reviews r
                      JOIN users u ON r.user_id = u.id
                      ORDER BY r.created_at DESC LIMIT 20''')
    reviews = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': r['id'],
        'name': f"{r['surname']} {r['name']}",
        'avatar': r['avatar'] or '👤',
        'rating': r['rating'],
        'text': r['text'],
        'order': r['order_number'],
        'date': r['created_at']
    } for r in reviews])

@bp.route('/reviews', methods=['POST'])
@login_required
def add_review(user_id):
    """Добавление отзыва"""
    data = request.json
    rating = data.get('rating')
    text = data.get('text', '')
    order_number = data.get('order_number')
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({'error': 'Поставьте оценку от 1 до 5'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO reviews (user_id, order_number, rating, text) VALUES (?, ?, ?, ?)",
                  (user_id, order_number, rating, text))
    conn.commit()
    conn.close()
    return jsonify({'success': True})