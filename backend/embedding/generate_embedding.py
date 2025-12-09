import sys
from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer("all-MiniLM-L6-v2")
query = sys.argv[1]

embedding = model.encode([query])[0]
print(json.dumps(embedding.tolist()))
