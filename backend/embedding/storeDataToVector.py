import psycopg2
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, VectorParams, Distance
from tqdm import tqdm
import os
import uuid
from dotenv import load_dotenv

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
BATCH_SIZE = 64
LIMIT_ROWS = 10 

# === STEP 1: Connect to PostgreSQL ===
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()
cursor.execute(f"""
    SELECT id, text
    FROM rawdata
    WHERE text IS NOT NULL
    LIMIT {LIMIT_ROWS};
""")
rows = cursor.fetchall()

# === STEP 2: Load Embedding Model ===
model = SentenceTransformer("all-MiniLM-L6-v2")

# === STEP 3: Connect to Qdrant ===
client = QdrantClient(host="localhost", port=6333)

# Create collection (or reset if exists)
client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# === STEP 4: Embed and Insert ===
for i in tqdm(range(0, len(rows), BATCH_SIZE)):
    batch = rows[i:i + BATCH_SIZE]
    ids = [row[0] for row in batch]
    texts = [row[1] for row in batch]
    vectors = model.encode(texts).tolist()

    points = [
        PointStruct(
            id=str(uuid.uuid4()), 
            vector=vectors[j],
            payload={
                "db_id": ids[j],      
                "text": texts[j]
            }
        )
        for j in range(len(batch))
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)

print("✅ First 100 rows inserted into Qdrant.")
