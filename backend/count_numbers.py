import pandas as pd
import psycopg2
import re
from transformers import AutoTokenizer

# ---------------------------
# 1. Connect to PostgreSQL
# ---------------------------

host = input("18.218.238.186")
user = input("lakshay")
password = input("world-peace")

conn = psycopg2.connect(
    host=host,
    user=user,
    password=password,
    port=5432,
    sslmode="require"
)

print("Connected to database!")

# ---------------------------
# 2. Query data from the table
# ---------------------------

query = """
SELECT text, dominant_emotion, created_at, data_source
FROM rawdata_with_emotion
"""

df = pd.read_sql(query, conn)
print("Rows loaded:", len(df))

# ---------------------------
# 3. Token length stats
# ---------------------------

tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

df["token_length"] = df["text"].astype(str).apply(lambda x: len(tokenizer.tokenize(x)))

avg_tokens = df["token_length"].mean()
median_tokens = df["token_length"].median()
max_tokens = df["token_length"].max()

print("\n--- Post Length Stats ---")
print("Average tokens:", round(avg_tokens, 2))
print("Median tokens:", median_tokens)
print("Max tokens:", max_tokens)

# ---------------------------
# 4. Vocabulary size
# ---------------------------

def normalize(t):
    t = t.lower()
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    return t

df["clean"] = df["text"].astype(str).apply(normalize)

vocab = set(" ".join(df["clean"]).split())
print("\nVocabulary size:", len(vocab))

# ---------------------------
# 5. Emotion-labeled posts
# ---------------------------

emotion_labeled = df[df["dominant_emotion"].notna()].shape[0]
print("\nEmotion-labeled posts:", emotion_labeled)

print("\n--- Emotion Distribution ---")
print(df["dominant_emotion"].value_counts())

# ---------------------------
# 6. Data source breakdown
# ---------------------------

if "data_source" in df.columns:
    print("\n--- Data Source Breakdown ---")
    print(df["data_source"].value_counts())

# ---------------------------
# 7. Date range
# ---------------------------

df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

print("\n--- Date Range ---")
print(df["created_at"].min(), "→", df["created_at"].max())
