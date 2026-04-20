from flask import Blueprint, request, jsonify
from database.db import get_db
from middleware.auth import login_required

bp = Blueprint('wishlist', __name__, url_prefix='/api')

@bp.route('/wishlist', methods=['GET'])
@login_required
def get_wishlist(user_id):
    """Получение избранного пользователя"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT product_id FROM wishlist WHERE user_id = ?", (user_id,))
    wishlist = [row['product_id'] for row in cursor.fetchall()]
    conn.close()
    return jsonify(wishlist)

@bp.route('/wishlist', methods=['POST'])
@login_required
def add_to_wishlist(user_id):
    """Добавление товара в избранное"""
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'error': 'Не указан товар'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)", (user_id, product_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@bp.route('/wishlist/<int:product_id>', methods=['DELETE'])
@login_required
def remove_from_wishlist(user_id, product_id):
    """Удаление товара из избранного"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", (user_id, product_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})