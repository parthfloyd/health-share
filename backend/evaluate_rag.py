from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall
)

from datasets import Dataset
import requests
from dotenv import load_dotenv
import os

load_dotenv()

# === 1. Define test questions ===
TEST_QUESTIONS = [
    "What does HealthShare do?",
    "How does your platform collect real-time tweets?",
    "Explain the architecture of HealthShare.",
    "How do you generate captions using YouDescribeX?",
]

# === 2. Call your Node RAG API to get answer + context ===
results = {
    "question": [],
    "answer": [],
    "contexts": [],
    "reference": [],
}

for q in TEST_QUESTIONS:
    r = requests.post("http://localhost:3003/ragchat/debug", json={"message": q})
    data = r.json()

    print(r.text)

    results["question"].append(data["question"])
    results["answer"].append(data["answer"])
    results["contexts"].append(data["contexts"])  # list of chunks
    results["reference"].append(data["reference"])

# Build HuggingFace dataset
dataset = Dataset.from_dict(results)

# === 3. Run Ragas Evaluation ===
metrics = [
    faithfulness,        # checks hallucination
    answer_relevancy,    # is answer relevant to question
    context_precision,   # retrieval accuracy
    context_recall       # retrieval coverage
]

evaluation = evaluate(dataset, metrics=metrics)

print("\n===== RAGAS EVALUATION =====\n")
print(evaluation)
