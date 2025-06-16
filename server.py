from flask import Flask, request, jsonify
from flask_cors import CORS
from services.persona_agent_service import PersonaAgent

app = Flask(__name__)
CORS(app)

agent = PersonaAgent()

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    data = request.json
    user_message = data.get('prompt', '')
    conversation_history = data.get('history', [])

    try:
        result = agent.process_message(user_message, conversation_history)
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
   app.run(debug=True, port=5050)