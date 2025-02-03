from flask import Flask, request, jsonify
from flask_cors import CORS
import json


app = Flask(__name__)
CORS(app)

# Function to read the IP from the ip_address.json file
def read_ip_from_json():
    try:
        with open('ip_address.json', 'r') as json_file:
            data = json.load(json_file)
            return data['ip']
    except Exception as e:
        return None

@app.route('/save-json', methods=['POST'])
def save_json():
    try:
        data = request.json
        with open('cards.json', 'w') as f:
            json.dump(data, f, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # app.run(debug=True)
    # app.run(host="192.168.181.17", port=5000)
    app.run(host= read_ip_from_json(), port=5000)