# chatbot_bp.py
import os
from flask import Blueprint, render_template, request, jsonify
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
client = InferenceClient(token=HF_TOKEN)
MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"

# Create a Blueprint instead of a Flask app
chatbot_bp = Blueprint('chatbot', __name__, template_folder='templates', static_folder='static')

SYSTEM_PROMPT = """You are an expert healthcare Bot wich specialized on dengue decies... [Your prompt here]"""

chat_history = [{"role": "system", "content": SYSTEM_PROMPT}]

@chatbot_bp.route('/chatbot') # This will be the URL for the nav bar
def chatbot_page():
    return render_template('chatbot_index.html') # Make sure to rename your HTML file

@chatbot_bp.route('/api/chat', methods=['POST'])
def chat():
    # ... (Keep the exact same /chat logic from before, just change the route to /api/chat)
    try:
        data = request.json
        user_message = data.get('message')
        chat_history.append({"role": "user", "content": user_message})
        
        response = client.chat_completion(model=MODEL_ID, messages=chat_history, max_tokens=500, stream=False)
        bot_reply = response.choices[0].message.content
        chat_history.append({"role": "assistant", "content": bot_reply})
        
        return jsonify({"response": bot_reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500