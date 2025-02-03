from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import json
import os
import sqlalchemy as db
from datetime import datetime

# Load the environment variables
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Function to read the IP from the ip_address.json file
def read_ip_from_json():
    try:
        with open('ip_address.json', 'r') as json_file:
            data = json.load(json_file)
            return data['ip']
    except Exception as e:
        return '0.0.0.0' # fallback to all interfaces if file not found

# Change these routes
@app.route('/')
def home():
    return send_file('index.html')  # Just the filename, not the directory

# Add route for other static files (CSS, JS, etc.)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_file(filename)  # Serve any requested file

# check environment
IS_DEVELOPMENT = os.getenv('ENVIRONMENT') == 'development'

if not IS_DEVELOPMENT:
    # Database setup for production
    DATABASE_URL = os.getenv('DATABASE_URL')
    engine = db.create_engine(DATABASE_URL)
    metadata = db.MetaData()
    
    # Define cards table
    cards_table = db.Table('cards', metadata,
        db.Column('id', db.Integer, primary_key=True),
        db.Column('term', db.String),
        db.Column('definition', db.String),
        db.Column('level', db.Integer),
        db.Column('difficulty', db.Integer),
        db.Column('ignored', db.Boolean),
        db.Column('lastReviewed', db.DateTime),
        db.Column('nextReview', db.DateTime),
        db.Column('niveau', db.String)
    )
    
    metadata.create_all(engine)

@app.route('/save-json', methods=['POST'])
def save_json():
    try:
        data = request.json

        if IS_DEVELOPMENT:
            # Local file storage
            with open('cards.json', 'w') as f:
                json.dump(data, f, indent=2)
        else:
            # Database storage
            with engine.connect() as connection:
                # Clear existing cards
                connection.execute(cards_table.delete())
                
                # Insert new cards
                for card in data:
                    # Convert string dates to datetime objects
                    card['lastReviewed'] = datetime.fromisoformat(card['lastReviewed'].replace('Z', '+00:00'))
                    card['nextReview'] = datetime.fromisoformat(card['nextReview'].replace('Z', '+00:00'))
                    connection.execute(cards_table.insert().values(card))

                connection.commit()

        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # For local development
    if IS_DEVELOPMENT:
        app.run(host=read_ip_from_json(), port=5000, debug=True)
    else:
        # For production
        port = int(os.environ.get('PORT', 10000))
        app.run(host='0.0.0.0', port=port)


# PermissionError
# PermissionError: [Errno 13] Permission denied: 'C:\\Users\\Ready2Use\\Desktop\\Flashcard App\\.'

# Traceback (most recent call last)
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 1536, in __call__
# return self.wsgi_app(environ, start_response)
#        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 1514, in wsgi_app
# response = self.handle_exception(e)
#            ^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask_cors\extension.py", line 194, in wrapped_function
# return cors_after_request(app.make_response(f(*args, **kwargs)))
#                                             ^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 1511, in wsgi_app
# response = self.full_dispatch_request()
#            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 919, in full_dispatch_request
# rv = self.handle_user_exception(e)
#      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask_cors\extension.py", line 194, in wrapped_function
# return cors_after_request(app.make_response(f(*args, **kwargs)))
#                                             ^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 917, in full_dispatch_request
# rv = self.dispatch_request()
#      ^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\app.py", line 902, in dispatch_request
# return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)  # type: ignore[no-any-return]
#        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\Desktop\Flashcard App\app.py", line 27, in home
# return send_file('.', 'index.html')
#        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\flask\helpers.py", line 511, in send_file
# return werkzeug.utils.send_file(  # type: ignore[return-value]
       
# File "C:\Users\Ready2Use\AppData\Local\Programs\Python\Python313\Lib\site-packages\werkzeug\utils.py", line 480, in send_file
# file = open(path, "rb")  # type: ignore
#        ^^^^^^^^^^^^^^^^
# PermissionError: [Errno 13] Permission denied: 'C:\\Users\\Ready2Use\\Desktop\\Flashcard App\\.'
# The debugger caught an exception in your WSGI application. You can now look at the traceback which led to the error.
# To switch between the interactive traceback and the plaintext one, you can click on the "Traceback" headline. From the text traceback you can also create a paste of it. For code execution mouse-over the frame you want to debug and click on the console icon on the right side.

# You can execute arbitrary Python code in the stack frames and there are some extra helpers available for introspection:

# dump() shows all variables in the frame
# dump(obj) dumps all that's known about the object
