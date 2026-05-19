# AllCanLearn

AI-powered podcast platform. Type any topic, get a 4-person deep-dive conversation with audio.

Live → **allcanlearn.uk**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Framer Motion, React Router v6 |
| Backend | FastAPI + uvicorn, Python 3.12 |
| Database | SQLite via SQLAlchemy |
| LLM | Groq API (LLaMA 3) |
| TTS | Piper (local, runs on Ubuntu) |
| Tunnel | Cloudflare Tunnel → allcanlearn.uk |
| Server | Ubuntu machine, systemd service |

---

## Project Structure

```
allcanlearn-v6/
│
├── app/                        # Python backend (FastAPI)
│   ├── main.py                 # API routes + server entry point
│   ├── config.py               # All settings loaded from .env
│   ├── database.py             # SQLAlchemy engine + session
│   ├── db_models.py            # Episode + Turn ORM models
│   ├── episodes.py             # DB read/write for episodes
│   ├── moderator.py            # Core: runs LLM + TTS per episode
│   ├── groq_client.py          # Groq API calls
│   ├── piper_tts_client.py     # Piper TTS (text → MP3)
│   ├── characters.py           # Default speaker personas
│   ├── *_characters.py         # Topic-specific speaker sets
│   ├── chat.py                 # WebSocket live chat manager
│   ├── quiz_generator.py       # Quiz generation via Groq
│   └── static/assets/          # Background images
│
├── src/                        # React frontend source
│   ├── App.js                  # Router + providers
│   ├── pages/                  # Home, Library, CreateEpisode, EpisodeDetail
│   ├── components/             # Layout, Games, Chat, UI primitives
│   ├── hooks/                  # useAudio, useEpisodes, useChat
│   └── services/api.js         # All API fetch calls
│
├── build/                      # React production build (served by FastAPI)
│
├── tts_output/                 # Generated MP3 audio files (gitignored)
├── allcanlearn.db              # SQLite database (gitignored)
│
├── allcanlearn.service         # systemd unit — auto-starts on Ubuntu boot
├── cloudflared-config.yml      # Cloudflare Tunnel config
├── start.sh                    # Quick start script (dev)
│
├── .env                        # Secrets — never commit this
├── .env.example                # Template for .env
├── requirements.txt            # Python dependencies
└── package.json                # Node dependencies
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Kamaraj13/allcanlearn-v6.git
cd allcanlearn-v6

# 2. Configure
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 3. Install Python deps
pip install -r requirements.txt

# 4. Install + build React
npm install && npm run build

# 5. Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or just:
```bash
./start.sh
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/episodes` | List all episodes |
| GET | `/api/episodes/{id}` | Full episode with all turns |
| POST | `/generate?topic=...` | Generate a new episode |
| GET | `/api/topics/popular` | Browse topic categories |
| WS | `/ws/chat?username=...` | Live group chat |

---

## Deploy on Ubuntu (Production)

```bash
# On Ubuntu machine
git clone https://github.com/Kamaraj13/allcanlearn-v6.git
cd allcanlearn-v6
pip install -r requirements.txt
cp .env.example .env && nano .env   # add GROQ_API_KEY

# Install as system service
sudo cp allcanlearn.service /etc/systemd/system/
sudo systemctl enable allcanlearn
sudo systemctl start allcanlearn

# Start Cloudflare tunnel
cloudflared tunnel run allcanlearn
```

---

## Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | Required. Get from console.groq.com |
| `DATABASE_URL` | `sqlite:///allcanlearn.db` | SQLite or PostgreSQL |
| `TTS_OUTPUT_DIR` | `tts_output` | Where MP3 files are saved |
| `MAX_TURNS` | `8` | Dialogue turns per episode |
| `MAX_ESSENTIAL_TURNS` | `16` | Turns for deep-dive episodes |
