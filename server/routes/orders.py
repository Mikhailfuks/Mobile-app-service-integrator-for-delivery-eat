from flask import Blueprint, request, jsonify
import json
import secrets
from database.db import get_db
from middleware.auth import login_required

bp = Blueprint('orders', __name__, url_prefix='/api')

@bp.route('/orders', methods=['GET'])
@login_required
def get_orders(user_id):
    """Получение истории заказов пользователя"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    orders = cursor.fetchall()
    conn.close()
    
    result = []
    for o in orders:
        result.append({
            'id': o['order_number'],
            'date': o['created_at'],
            'items': json.loads(o['items']),
            'total': o['total'],
            'deliveryType': o['delivery_type'],
            'tip': o['tip'],
            'status': o['status'],
            'address': o['address']
        })
    return jsonify(result)

@bp.route('/orders', methods=['POST'])
@login_required
def create_order(user_id):
    """Создание нового заказа"""
    data = request.json
    items = data.get('items')
    total = data.get('total')
    delivery_type = data.get('deliveryType', 'standard')
    tip = data.get('tip', 0)
    address = data.get('address', '')
    payment_method = data.get('paymentMethod', 'balance')
    
    if not items or not total:
        return jsonify({'error': 'Нет данных заказа'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Проверка баланса при оплате с баланса
    if payment_method == 'balance':
        cursor.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if user['balance'] < total:
            conn.close()
            return jsonify({'error': 'Недостаточно средств на балансе'}), 400
        cursor.execute("UPDATE users SET balance = balance - ? WHERE id = ?", (total, user_id))
    
    # Кэшбэк (5% или 15% для premium)
    cursor.execute("SELECT is_premium FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    cashback_rate = 15 if user['is_premium'] else 5
    cashback = int(total * cashback_rate / 100)
    cursor.execute("UPDATE users SET bonus = bonus + ? WHERE id = ?", (cashback, user_id))
    
    # Создание заказа
    order_number = f"#{secrets.token_hex(4).upper()}"
    cursor.execute('''INSERT INTO orders (order_number, user_id, items, total, delivery_type, tip, address, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 'Оплачен')''',
                   (order_number, user_id, json.dumps(items), total, delivery_type, tip, address))
    
    # Транзакции
    cursor.execute("INSERT INTO transactions (user_id, type, amount, icon) VALUES (?, ?, ?, ?)",
                  (user_id, f'Оплата заказа {order_number}', -total, '🛒'))
    if cashback > 0:
        cursor.execute("INSERT INTO transactions (user_id, type, amount, icon) VALUES (?, ?, ?, ?)",
                      (user_id, 'Кэшбэк', cashback, '✨'))
    
    conn.commit()
    
    # Проверка Premium (если сумма заказа >= 4000)
    if total >= 4000:
        cursor.execute("UPDATE users SET is_premium = 1 WHERE id = ? AND is_premium = 0", (user_id,))
        conn.commit()
    
    conn.close()
    
    return jsonify({'success': True, 'order_number': order_number, 'cashback': cashback})