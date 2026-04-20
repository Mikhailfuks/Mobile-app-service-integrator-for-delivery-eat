from flask import Blueprint, request, jsonify
from database.db import get_db

bp = Blueprint('products', __name__, url_prefix='/api')

@bp.route('/products', methods=['GET'])
def get_products():
    """Получение списка товаров с фильтрацией"""
    category = request.args.get('category')
    popular = request.args.get('popular')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    if category and category != 'all':
        query += " AND category = ?"
        params.append(category)
    if popular and popular == 'true':
        query += " AND popular = 1"
    
    cursor.execute(query, params)
    products = cursor.fetchall()
    
    result = []
    for p in products:
        cursor.execute("SELECT name, price, icon FROM addons WHERE product_id = ?", (p['id'],))
        addons = [{'name': a['name'], 'price': a['price'], 'icon': a['icon']} for a in cursor.fetchall()]
        result.append({
            'id': p['id'],
            'name': p['name'],
            'basePrice': p['base_price'],
            'rating': p['rating'],
            'category': p['category'],
            'icon': p['icon'],
            'popular': bool(p['popular']),
            'weight': p['weight'],
            'calories': p['calories'],
            'cookingTime': p['cooking_time'],
            'composition': p['composition'],
            'nutritional': p['nutritional'],
            'description': p['description'],
            'addons': addons
        })
    
    conn.close()
    return jsonify(result)

@bp.route('/bonus-products', methods=['GET'])
def get_bonus_products():
    """Получение списка товаров за бонусы"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bonus_products")
    products = cursor.fetchall()
    conn.close()
    return jsonify([{'id': p['id'], 'name': p['name'], 'bonusPrice': p['bonus_price'], 'icon': p['icon']} for p in products])