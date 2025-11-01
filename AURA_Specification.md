# AURA — Autonomous Up-skilling & Role-Acquisition Agent
### Comprehensive Engineering Specification (for Codex and agent collaboration)

---

## 1. Mission & Overview
**Goal:** Build an autonomous AI system that continuously searches for career opportunities, evaluates them based on evolving user preferences, generates personalized application materials, learns from outcomes, and recommends skill improvements.

**Core Principles**
- Modular architecture: every subsystem independent and easily replaceable.
- Data privacy by design: all data stored locally unless explicitly configured.
- Full reproducibility through Docker.
- Self-improving loop (data ingestion → evaluation → feedback → retraining).

---

## 2. System Workflow

1. **Weekly Job Discovery**
   - Fetch new job listings (≤7 days old) from multiple sources (e.g., Glassdoor, LinkedIn, RemoteOK, Indeed).
   - Normalize job data: title, company, location, salary, description, date posted, URL.
   - Store in local database.

2. **Semantic Scoring**
   - Generate dense embeddings for job descriptions and user profile.
   - Compute similarity scores using cosine distance.
   - Combine with metadata (salary normalization, location weight, company prestige).

3. **User Interaction**
   - Present top-5 ranked jobs via CLI or web dashboard.
   - Collect ratings (fit, interest, prestige, location, etc.) and optional comments.

4. **Learning Loop**
   - Train or update:
     - **Embedding fine-tuner:** contrastive loss on positive (liked) vs negative (rejected) jobs.
     - **Preference model:** LSTM predicting rating vector for next cycle.
     - **Policy agent:** reinforcement learner optimizing which jobs to present.
   - Update database with results and metrics.

5. **Application Generation**
   - Use LLM or local small model to craft:
     - Tailored CV highlighting matched skills.
     - Personalized cover letter referencing job keywords.
   - Output as Markdown and PDF in `/outputs`.

6. **Outcome Tracking**
   - User logs interview stages or offers.
   - System stores outcome as reward for reinforcement agent.

7. **Skill-Gap Analysis**
   - Extract recurring skill keywords from highly-rated but unsuccessful postings.
   - Compare against existing CV to identify missing skills.
   - Recommend upskilling resources (optional API integration).

---

## 3. Architecture

### 3.1 Layered Design
```
┌──────────────────────────────┐
│ Ingestion Layer              │
│   - Scraper / API clients    │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Database Layer (SQLite/Postgres) │
│   - jobs, ratings, outcomes   │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Embedding & Scoring Layer    │
│   - Sentence Transformers     │
│   - FAISS index for similarity │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Learning Layer               │
│   - LSTM preference model    │
│   - RL agent (DQN/PPO)       │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Generation Layer             │
│   - CV & Cover Letter LLM    │
└───────────┬──────────────────┘
            ▼
┌──────────────────────────────┐
│ Analytics & Dashboard Layer  │
│   - Streamlit or Dash         │
└──────────────────────────────┘
```

---

## 4. Data Schema (SQLite / Postgres)

### Table: `jobs`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto |
| title | TEXT | Job title |
| company | TEXT | Company name |
| location | TEXT | City, country |
| salary_min | REAL | Minimum salary |
| salary_max | REAL | Maximum salary |
| currency | TEXT | Currency code |
| description | TEXT | Full text |
| url | TEXT | Original link |
| date_posted | DATE | Posting date |
| embedding | BLOB | Vector serialized (np.ndarray) |

### Table: `ratings`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY |
| job_id | INTEGER | FK → jobs.id |
| fit_score | INTEGER | 1–10 |
| interest_score | INTEGER | 1–10 |
| prestige_score | INTEGER | 1–10 |
| location_score | INTEGER | 1–10 |
| comment | TEXT | Optional feedback |
| timestamp | DATETIME | When rated |

### Table: `outcomes`
| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY |
| job_id | INTEGER | FK → jobs.id |
| stage | TEXT | e.g., “none”, “interview1”, “offer” |
| reward | REAL | Derived numeric reward |
| timestamp | DATETIME | |

---

## 5. Machine Learning Components

### 5.1 Embedding Engine
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Loss: Contrastive (InfoNCE)
- Function: `encode_jobs(texts: list[str]) -> np.ndarray`
- Fine-tuning: optional with labeled “liked” vs “disliked” pairs.

### 5.2 Preference Model
- Architecture: 2-layer LSTM → Dense(5) predicting user rating vector.
- Inputs: chronological list of job embedding + previous rating vector.
- Loss: MSE.

### 5.3 Reinforcement Learning Agent
- Algorithm: start with Contextual Bandit → Deep Q-Network.
- State vector: concat(preference_vector, avg_embedding(top_jobs)).
- Action space: {choose 5 jobs out of N}.
- Reward: weighted function of (user_rating, interview_stage).
- Library: `stable-baselines3` or custom PyTorch.

### 5.4 CV/CL Generator
- Uses template prompting:
  - Input: {job_description, user_profile_json, key_skills}.
  - Output: Markdown and PDF.
- Option 1: OpenAI API (cheap, reliable).
- Option 2: local small model via `llama.cpp`.

### 5.5 Skill-Gap Analyzer
- Extract skills with `spaCy` + `KeyBERT`.
- Compute TF-IDF frequency difference between high-rated and low-rated jobs.
- Recommend top missing skills.

---

## 6. Data Flow Summary
1. `scraper.py` → fetch JSON → DB insert.  
2. `embeddings.py` → generate & store vectors → FAISS index.  
3. `rank_jobs.py` → rank by similarity & scoring heuristic.  
4. `feedback.py` → collect user ratings → update DB.  
5. `train_preference_model.py` → update LSTM weights.  
6. `rl_agent.py` → learn policy, log cumulative reward.  
7. `generator.py` → produce CV & CL outputs.  
8. `analyzer.py` → update skills report.  
9. `dashboard/app.py` → render metrics & trends.

---

## 7. Modularity & Extensibility
- All models loaded from `config.yaml`:
  - Embedding model name
  - RL algorithm
  - LLM provider
- Database ORM (e.g., `SQLAlchemy`) abstracts persistence layer.
- Job scrapers registered dynamically via `entry_points` pattern.

---

## 8. Dockerization

### Dockerfile (overview)
```Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
COPY data/ ./data/
ENV PYTHONPATH=/app/src
CMD ["python", "src/main.py"]
```

### docker-compose.yml
```yaml
version: "3.8"
services:
  aura:
    build: .
    container_name: aura_core
    volumes:
      - ./data:/app/data
    environment:
      - PYTHONUNBUFFERED=1
  dashboard:
    build: .
    command: streamlit run src/dashboard/app.py
    ports:
      - "8501:8501"
    depends_on:
      - aura
```

---

## 9. Configuration

`config.yaml`
```yaml
paths:
  data_dir: "./data"
  models_dir: "./models"
models:
  embedding: "sentence-transformers/all-MiniLM-L6-v2"
  preference_model: "lstm"
  rl_agent: "dqn"
llm:
  provider: "openai"
  temperature: 0.2
job_sources:
  - name: "RemoteOK"
    url: "https://remoteok.io/api"
  - name: "Indeed"
    search_terms: ["data scientist", "strategy consultant"]
schedule:
  frequency: "weekly"
  day: "Friday"
```

---

## 10. Metrics & Logging
- Log all events to `logs/aura.log` via `logging` module.
- Weekly metrics written to `data/metrics.json`:
  - `avg_match_score`
  - `avg_rating`
  - `cumulative_reward`
  - `skill_gap_index`
- Use `matplotlib` or `plotly` for visual trends.

---

## 11. Evaluation

| Stage | Metric | Target |
|--------|--------|--------|
| Embedding | Mean Reciprocal Rank (MRR) | ≥0.70 |
| Preference | RMSE of rating prediction | ≤0.5 |
| RL Agent | Average reward per episode | ↑ over time |
| Application | Interview conversion rate | ↑ over time |

---

## 12. Development Timeline (16 Weeks)

| Phase | Deliverables | Time |
|--------|--------------|------|
| 1 | Repo setup, Docker, dummy pipeline | Week 1–2 |
| 2 | Scraper + DB | Week 3–4 |
| 3 | Embeddings + FAISS | Week 5–6 |
| 4 | Feedback interface | Week 7–8 |
| 5 | LSTM preference | Week 9–10 |
| 6 | RL agent | Week 11–12 |
| 7 | CV/CL generator | Week 13–14 |
| 8 | Skill-gap + Dashboard | Week 15–16 |

---

## 13. Testing & Validation
- Unit tests with `pytest` under `/tests`.
- Mock data generator for reproducible experiments.
- Integration tests for DB and scraping modules.
- Performance benchmark on sample 1000 postings.

---

## 14. Security & Privacy
- No external data transmission by default.
- API keys stored in `.env`.
- Sanitized logs (no PII).
- Optional encryption for CV and outcomes tables.

---

## 15. Deliverables for First Commit
1. `src/` skeleton with placeholder modules and docstrings.
2. `requirements.txt` and `Dockerfile`.
3. `README.md` (user-facing summary).
4. `AURA_Specification.md` (this document).
5. Dummy `jobs.db` and `config.yaml`.

---

**End of specification.**

