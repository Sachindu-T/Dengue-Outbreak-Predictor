import os  
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from typing import List


load_dotenv()
print("Environment variables loaded")

class SmartPDFProcessor:
    # Advanced PDF processing with error handling
    def __init__(self,chunk_size=1000,chunk_overlap=100):
        self.chunk_size=chunk_size,
        self.chunk_overlap=chunk_overlap,
        self.text_splitter=RecursiveCharacterTextSplitter(chunk_size=chunk_size,chunk_overlap=chunk_overlap,separators=[" "],)

    def process_pdf(self,pdf_path:str)->List[Document]:
        #Process PDF with smart chunking and metadata enhancement
        loader=PyMuPDFLoader(pdf_path)
        pages=loader.load()

        processed_chunks=[]

        for page_num,page in enumerate(pages):
            cleaned_text=self._clean_text(page.page_content)
            # Skip nearly empty pages
            if len(cleaned_text.strip()) < 50:
                continue
            # Create chunks with enhanced metadata
            chunks = self.text_splitter.create_documents(
                texts=[cleaned_text],
                metadatas=[{
                    **page.metadata,
                    "page": page_num + 1,
                    "total_pages": len(pages),
                    "chunk_method": "smart_pdf_processor",
                    "char_count": len(cleaned_text)
                }]
            )
            
            processed_chunks.extend(chunks)

        return processed_chunks

    def _clean_text(self, text: str) -> str:
        text = " ".join(text.split())     
        text = text.replace("ﬁ", "fi")
        text = text.replace("ﬂ", "fl")
        
        return text

preprocessor=SmartPDFProcessor()

smart_chunks=[]
BASE_DIR = os.path.abspath('.')
PDFs = ["Bed-Data-2025-Updated.pdf","Guidelines-on-Management-of-Dengue-Fever.pdf","Mid-year_population_by_district__Sex.pdf","National-Strategic-Plan-on-Dengue-Prevention-and-Control-2024-to-2030.pdf","Clinical-Management-of-Dengue-in-Pregnancy-compress.pdf","E-book-ORIGINAL-National-Dengue-Guidelines-2024.pdf","Guidelines-on-Aedes-vector-surveillance-and-control-in-Sri-Lanka-2nd-Edition-2025 .pdf","SOP-document_B5.pdf"]  
for pdf_file in PDFs:
    pdf_path = os.path.join(BASE_DIR,"data", pdf_file)
    try:
        chunks = preprocessor.process_pdf(pdf_path)
        smart_chunks.extend(chunks)  
        print(f"Processed into {len(chunks)} smart chunks")

        if smart_chunks:
            print("\nSample chunk metadata:")
            for key, value in chunks[0].metadata.items():
                print(f"  {key}: {value}")

    except Exception as e:
        print(f"Processing error: {e}")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",   
    model_kwargs={"device": "cpu"},                        
    encode_kwargs={"normalize_embeddings": True}
)

vectorstore = FAISS.from_documents(documents=smart_chunks,embedding=embeddings)

FAISS_INDEX_PATH = "faiss_index"

vectorstore.save_local(FAISS_INDEX_PATH)
print("Vector store saved to 'faiss_index' directory")



