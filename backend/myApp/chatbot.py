import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

BASE_DIR = os.path.abspath('.')
FAISS_INDEX_PATH = os.path.join(BASE_DIR,"faiss_index")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",   
    model_kwargs={"device": "cpu"},                        
    encode_kwargs={"normalize_embeddings": True}
)

loaded_vectorstore = FAISS.load_local(FAISS_INDEX_PATH,embeddings,allow_dangerous_deserialization=True)

load_dotenv()    

os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")            # Load API Key

llm = init_chat_model(model="groq:qwen/qwen3.8-27b")

simple_prompt = ChatPromptTemplate.from_template("""
You are a helpful dengue information assistant.

Answer the user's question using the provided context.

Instructions:
- Give the answer directly and naturally.
- Do not mention documents, sources, context, retrieved information, or where the information came from.
- Do not say phrases such as "According to the document", "Based on the provided context", or "Document 1".
- Do not discuss how you generated the answer.
- If the context does not contain enough information to answer the question, say that you do not have enough information.

Context:
{context}

Question:
{question}

Answer:
""")

vectorstore = FAISS.load_local(FAISS_INDEX_PATH,embeddings,allow_dangerous_deserialization=True) 
retriever=vectorstore.as_retriever(search_type="similarity",search_kwargs={"k":3})

def format_docs(docs: list[Document]) -> str:
    formatted = []
    for i, doc in enumerate(docs):
        source = doc.metadata.get('source', 'Unknown')
        formatted.append(f"Document {i+1} (Source: {source}):\n{doc.page_content}")
    return "\n\n".join(formatted)

rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | simple_prompt
    | llm
    | StrOutputParser()
)

def ask_chatbot(question: str) -> dict:
    answer = rag_chain.invoke(question)

    return {"q": question,"a": answer }

print(ask_chatbot("What is dengue"))