from flask import Blueprint, request, jsonify
from database.db import get_db
from middleware.auth import login_required
from utils.validators import validate_card_expiry

bp = Blueprint('user', __name__, url_prefix='/api')

@bp.route('/profile', methods=['GET'])
@login_required
def get_profile(user_id):
    """Получение профиля пользователя"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, surname, name, patronymic, inn, phone, avatar, balance, bonus, is_premium FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    cursor.execute("SELECT notifications_enabled FROM settings WHERE user_id = ?", (user_id,))
    settings = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    return jsonify({
        'id': user['id'],
        'surname': user['surname'],
        'name': user['name'],
        'patronymic': user['patronymic'],
        'inn': user['inn'],
        'phone': user['phone'],
        'avatar': user['avatar'],
        'balance': user['balance'],
        'bonus': user['bonus'],
        'is_premium': bool(user['is_premium']),
        'notifications_enabled': bool(settings['notifications_enabled']) if settings else True
    })

@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile(user_id):
    """Обновление профиля пользователя"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    updates = []
    params = []
    for field in ['surname', 'name', 'patronymic', 'phone', 'avatar']:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])
    params.append(user_id)
    
    if updates:
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
    
    if 'notifications_enabled' in data:
        cursor.execute("UPDATE settings SET notifications_enabled = ? WHERE user_id = ?", 
                      (1 if data['notifications_enabled'] else 0, user_id))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@bp.route('/balance', methods=['GET'])
@login_required
def get_balance(user_id):
    """Получение баланса и бонусов"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT balance, bonus FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return jsonify({'balance': user['balance'], 'bonus': user['bonus']})

@bp.route('/replenish', methods=['POST'])
@login_required
def replenish_balance(user_id):
    """Пополнение баланса (симуляция платежа)"""
    data = request.json
    amount = data.get('amount')
    card_number = data.get('card_number')
    card_expiry = data.get('expiry')
    card_cvv = data.get('cvv')
    card_holder = data.get('holder')
    inn = data.get('inn')
    bank = data.get('bank', 'Сбербанк')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Введите сумму'}), 400
    
    card_number_clean = card_number.replace(' ', '') if card_number else ''
    if len(card_number_clean) != 16:
        return jsonify({'error': 'Неверный номер карты'}), 400
    
    if not validate_card_expiry(card_expiry):
        return jsonify({'error': 'Срок карты истёк или неверный формат'}), 400
    
    if not card_cvv or len(card_cvv) != 3:
        return jsonify({'error': 'CVV должен содержать 3 цифры'}), 400
    
    if not card_holder or len(card_holder) < 3:
        return jsonify({'error': 'Укажите владельца карты'}), 400
    
    if not inn or len(inn) != 12:
        return jsonify({'error': 'Введите корректный ИНН (12 цифр)'}), 400
    
    # Симуляция пополнения
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (amount, user_id))
    cursor.execute("INSERT INTO transactions (user_id, type, amount, icon) VALUES (?, ?, ?, ?)",
                  (user_id, f'Пополнение {amount}₽ ({bank}, ИНН {inn})', amount, '🏦'))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'new_balance': amount})

@bp.route('/cards', methods=['GET'])
@login_required
def get_cards(user_id):
    """Получение списка карт пользователя"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, last_four, holder, expiry FROM cards WHERE user_id = ?", (user_id,))
    cards = cursor.fetchall()
    conn.close()
    return jsonify([{'id': c['id'], 'last_four': c['last_four'], 'holder': c['holder'], 'expiry': c['expiry']} for c in cards])

@bp.route('/cards', methods=['POST'])
@login_required
def add_card(user_id):
    """Добавление новой карты"""
    data = request.json
    card_number = data.get('card_number', '').replace(' ', '')
    expiry = data.get('expiry')
    holder = data.get('holder')
    
    if len(card_number) != 16:
        return jsonify({'error': 'Неверный номер карты'}), 400
    
    if not validate_card_expiry(expiry):
        return jsonify({'error': 'Неверный формат срока или срок истёк'}), 400
    
    if not holder or len(holder) < 3:
        return jsonify({'error': 'Укажите владельца карты'}), 400
    
    last_four = card_number[-4:]
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO cards (user_id, last_four, holder, expiry) VALUES (?, ?, ?, ?)",
                  (user_id, last_four, holder, expiry))
    card_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': card_id, 'last_four': last_four, 'holder': holder, 'expiry': expiry})

@bp.route('/cards/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(user_id, card_id):
    """Удаление карты"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cards WHERE id = ? AND user_id = ?", (card_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@bp.route('/transactions', methods=['GET'])
@login_required
def get_transactions(user_id):
    """Получение истории транзакций"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT type, amount, icon, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (user_id,))
    transactions = cursor.fetchall()
    conn.close()
    return jsonify([{
        'type': t['type'],
        'amount': t['amount'],
        'icon': t['icon'],
        'date': t['created_at']
    } for t in transactions])