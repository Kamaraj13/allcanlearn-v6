# AllCanLearn-v6 - Portable Version

🎙️ AI-Powered Podcast Generation Platform
🌍 Deploy Anywhere in Minutes

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- 2GB RAM minimum
- Internet connection

### 1. Clone & Setup
```bash
git clone <repository-url>
cd allcanlearn-v6
chmod +x *.sh
```

### 2. Start the App
```bash
./start.sh
```

## 🌐 Domain Setup (Optional)

### 1. Setup Cloudflare Tunnel
```bash
./setup-cloudflare.sh
```

### 2. Start Tunnel
```bash
./start-tunnel.sh
```

## 📝 Configuration

Edit .env file:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

## 🎯 Features

- ✅ Netflix-style UI with beautiful themes
- ✅ AI Podcast Generation with multiple voices
- ✅ Create Custom Topics on any subject
- ✅ Dark/Bright Theme Toggle
- ✅ Responsive Design (mobile-friendly)
- ✅ Real-time Chat functionality
- ✅ Audio Player with controls

## 🛠️ Troubleshooting

### Python Version Issues
```bash
python3 --version
```

### Port Already in Use
```bash
lsof -ti:8000 | xargs kill -9
```

---

🎙️ AllCanLearn-v6 - Podcast Generation Made Simple
Deploy Anywhere • Use Everywhere • Share with Everyone
