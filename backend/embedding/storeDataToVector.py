import psycopg2
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, VectorParams, Distance
from tqdm import tqdm
import os
import uuid
from dotenv import load_dotenv
from transformers import AutoTokenizer

load_dotenv()

# === CONFIG ===
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": 5432,
    "database": "lakshay",
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}

COLLECTION_NAME = "healthshare"
CHUNK_SIZE = 256    # tokens per chunk
CHUNK_OVERLAP = 32  # tokens overlap between chunks
BATCH_SIZE = 64     # batch size for upserting to Qdrant

# === Helper: Chunking Function ===
model_name = "sentence-transformers/all-MiniLM-L6-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    tokens = tokenizer.encode(text, add_special_tokens=False)
    chunks = []
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk_tokens = tokens[i:i+chunk_size]
        chunk = tokenizer.decode(chunk_tokens)
        chunks.append(chunk)
    return chunks

# === STEP 1: Connect to PostgreSQL ===
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()
cursor.execute("""
    SELECT id, text
    FROM rawdata
    WHERE text IS NOT NULL
""")
rows = cursor.fetchall()

# === STEP 2: Load Embedding Model ===
model = SentenceTransformer(model_name)

# === STEP 3: Connect to Qdrant ===
client = QdrantClient(host="localhost", port=6333)

# Create or reset collection
client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# === STEP 4: Embed and Insert All Vectors ===
all_points = []

for db_id, text in tqdm(rows):
    chunks = chunk_text(text)
    if not chunks:
        continue

    chunk_vectors = model.encode(chunks).tolist()

    for chunk_idx, (chunk, vector) in enumerate(zip(chunks, chunk_vectors)):
        all_points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "db_id": db_id,
                    "chunk_no": chunk_idx,
                    "text": chunk
                }
            )
        )

    # Batch upsert for efficiency
    if len(all_points) >= BATCH_SIZE:
        client.upsert(collection_name=COLLECTION_NAME, points=all_points)
        all_points = []

# Final upsert for leftover vectors
if all_points:
    client.upsert(collection_name=COLLECTION_NAME, points=all_points)

print("✅ All vector chunks from the database inserted into Qdrant.")
