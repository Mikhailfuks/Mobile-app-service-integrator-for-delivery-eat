from flask import Blueprint, request, jsonify
import hashlib
from database.db import get_db

bp = Blueprint('auth', __name__, url_prefix='/api')

@bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.json
    surname = data.get('surname')
    name = data.get('name')
    patronymic = data.get('patronymic', '')
    inn = data.get('inn')
    phone = data.get('phone')
    password = data.get('password')
    
    if not all([surname, name, inn, phone, password]):
        return jsonify({'error': 'Заполните все поля'}), 400
    
    if len(inn) != 12 or not inn.isdigit():
        return jsonify({'error': 'ИНН должен содержать 12 цифр'}), 400
    
    password_hash = hashlib.md5(password.encode()).hexdigest()
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''INSERT INTO users (surname, name, patronymic, inn, phone, password_hash)
                          VALUES (?, ?, ?, ?, ?, ?)''',
                       (surname, name, patronymic, inn, phone, password_hash))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO settings (user_id) VALUES (?)", (user_id,))
        conn.commit()
        
        token = hashlib.md5(f"{user_id}_megafood_secret".encode()).hexdigest()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'token': token,
            'name': name,
            'balance': 0,
            'bonus': 340
        })
    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        if 'inn' in error_msg:
            return jsonify({'error': 'Пользователь с таким ИНН уже существует'}), 400
        elif 'phone' in error_msg:
            return jsonify({'error': 'Пользователь с таким телефоном уже существует'}), 400
        return jsonify({'error': 'Ошибка регистрации'}), 400
    finally:
        conn.close()

@bp.route('/login', methods=['POST'])
def login():
    """Вход пользователя"""
    data = request.json
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({'error': 'Введите телефон и пароль'}), 400
    
    password_hash = hashlib.md5(password.encode()).hexdigest()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ? AND password_hash = ?", (phone, password_hash))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Неверный телефон или пароль'}), 401
    
    token = hashlib.md5(f"{user['id']}_megafood_secret".encode()).hexdigest()
    
    return jsonify({
        'success': True,
        'user_id': user['id'],
        'token': token,
        'name': user['name'],
        'balance': user['balance'],
        'bonus': user['bonus'],
        'is_premium': bool(user['is_premium'])
    })
