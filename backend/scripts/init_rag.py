import os
import sys

# Add the parent directory to the python path so we can import dashboard
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from dashboard.rag import RAGChatbot

if __name__ == "__main__":
    print("Initializing RAG Chatbot FAISS index...")
    try:
        # This will trigger the _init_vector_store method
        chatbot = RAGChatbot.get_instance()
        print("FAISS index successfully initialized and RAG Chatbot is ready!")
    except Exception as e:
        print(f"Failed to initialize RAG Chatbot: {e}")
