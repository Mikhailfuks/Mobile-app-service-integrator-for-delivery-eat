from flask import Flask, jsonify
from flask_cors import CORS
from database.db import init_db
from routes import auth, user, products, orders, wishlist, reviews, notifications, admin

app = Flask(__name__)
app.config['SECRET_KEY'] = 'megafood-secret-key-2024'
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"])

# Инициализация базы данных
init_db()

# Регистрация маршрутов
app.register_blueprint(auth.bp)
app.register_blueprint(user.bp)
app.register_blueprint(products.bp)
app.register_blueprint(orders.bp)
app.register_blueprint(wishlist.bp)
app.register_blueprint(reviews.bp)
app.register_blueprint(notifications.bp)
app.register_blueprint(admin.bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'MEGAFOOD API работает'})

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Сервер MEGAFOOD запущен!")
    print("📍 Адрес: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)