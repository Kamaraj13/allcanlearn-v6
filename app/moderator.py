# moderator.py

import asyncio
import json
import re
from app.groq_client import call_groq
from app.characters import CHARACTERS
from app.travel_characters import TRAVEL_CHARACTERS, CITIES
from app.tech_startup_characters import TECH_STARTUP_CHARACTERS
from app.personal_finance_characters import PERSONAL_FINANCE_CHARACTERS
from app.mental_health_characters import MENTAL_HEALTH_CHARACTERS
from app.piper_tts_client import speak_text
from app.config import settings

MAX_TURNS = settings.MAX_TURNS
MAX_ESSENTIAL_TURNS = settings.MAX_ESSENTIAL_TURNS

# ── Streaming characters ───────────────────────────────────────────────────
# Used by the streaming generator for any topic
STREAM_CHARACTERS = [
    {
        "name": "The Expert",
        "role": "Deep domain knowledge",
        "accent": "en-us",
        "style": "Precise, evidence-based, uses data and research. Slightly formal.",
    },
    {
        "name": "The Skeptic",
        "role": "Questions everything",
        "accent": "en-gb",
        "style": "Challenges assumptions, plays devil's advocate, demands proof.",
    },
    {
        "name": "The Optimist",
        "role": "Finds the opportunity",
        "accent": "en-us",
        "style": "Enthusiastic, forward-thinking, finds silver linings, uses analogies.",
    },
    {
        "name": "The Pragmatist",
        "role": "Practical real-world focus",
        "accent": "en-us",
        "style": "Cuts through theory, asks 'but what does this mean for real people?'",
    },
]


def parse_responses(response):
    """Parse JSON response from Groq API."""
    try:
        if isinstance(response, str):
            return json.loads(response)
        elif isinstance(response, list):
            return response
        else:
            return []
    except (json.JSONDecodeError, TypeError) as e:
        print(f"Error parsing responses: {e}")
        return []

def normalize_responses(parsed_responses, characters):
    """Normalize parsed responses to ensure proper speaker matching and structure."""
    normalized = []
    
    if not parsed_responses or not isinstance(parsed_responses, list):
        return normalized
    
    character_names = [char["name"] for char in characters]
    
    for i, response in enumerate(parsed_responses):
        if not isinstance(response, dict):
            continue
            
        speaker = response.get("speaker", "")
        message = response.get("message", "")
        
        if not message.strip():
            continue
            
        if speaker not in character_names:
            for char_name in character_names:
                if speaker.lower() in char_name.lower() or char_name.lower() in speaker.lower():
                    speaker = char_name
                    break
            else:
                if i < len(characters):
                    speaker = characters[i]["name"]
                else:
                    speaker = characters[0]["name"]
        
        normalized.append({
            "speaker": speaker,
            "message": message,
            "audio_file": None
        })
    
    return normalized

def attach_accents(parsed_responses, characters):
    """Attach accent information to parsed responses."""
    character_map = {char["name"]: char for char in characters}
    
    for response in parsed_responses:
        speaker = response.get("speaker", "")
        if speaker in character_map:
            response["accent"] = character_map[speaker].get("accent", "default")
        else:
            response["accent"] = "default"
    
    return parsed_responses

def build_government_jobs_prompt(turns, topic, characters):
    """Build the prompt for government jobs discussions."""
    if not turns:
        return f"""Create a roundtable discussion about "{topic}" with 4 government job experts: Exam Strategist, Serving Officer, Fresh Qualifier, and Citizen.
        
Each person should provide their unique perspective on {topic} from their role:
- Exam Strategist: Strategic advice and preparation tips
- Serving Officer: Real-world experience and insights  
- Fresh Qualifier: Recent experience and relatable struggles
- Citizen: Public perspective and questions

Return your response as a JSON array with this format:
[
    {{"speaker": "Exam Strategist", "message": "strategic advice"}},
    {{"speaker": "Serving Officer", "message": "real-world insights"}},
    {{"speaker": "Fresh Qualifier", "message": "recent experience"}},
    {{"speaker": "Citizen", "message": "public perspective"}}
]

Keep responses concise but informative (2-3 sentences each)."""
    else:
        last_turn = turns[-1] if turns else None
        context = ""
        if last_turn:
            context = "The last speaker was " + str(last_turn.get("speaker", "Someone")) + " who said: " + str(last_turn.get("message", ""))
        
        return f"""Continue the government jobs discussion about "{topic}" with the same 4 experts.
        
{context}

Each speaker should:
- React to previous points when relevant
- Add new insights from their perspective
- Keep responses concise (2-3 sentences each)

Return as JSON array:
[
    {{"speaker": "Exam Strategist", "message": "strategic advice"}},
    {{"speaker": "Serving Officer", "message": "real-world insights"}},
    {{"speaker": "Fresh Qualifier", "message": "recent experience"}},
    {{"speaker": "Citizen", "message": "public perspective"}}
]"""

def build_government_jobs_system_prompt(characters):
    """Build the system prompt for government jobs discussions."""
    return """You are facilitating an informative roundtable discussion about government jobs and competitive exams in India. 

The panel consists of:
- Exam Strategist: Provides strategic guidance and preparation advice
- Serving Officer: Shares real experience from working in government
- Fresh Qualifier: Recently cleared exams, shares current experience
- Citizen: Asks questions and provides public perspective

Always return your response as a valid JSON array with the exact format specified. Do not include any explanations or text outside the JSON array. Make the discussion realistic, helpful, and engaging for aspirants."""
async def generate_tts_batch(entries, tts_enabled):
    """Parallelize TTS generation for multiple speakers at once."""
    if not tts_enabled:
        return entries
    
    # Generate all TTS files in parallel
    tts_tasks = []
    for entry in entries:
        task = speak_text(entry["message"], entry["accent"])
        tts_tasks.append(task)
    
    tts_results = await asyncio.gather(*tts_tasks, return_exceptions=True)
    
    # Attach results to entries
    for entry, tts_result in zip(entries, tts_results):
        if not isinstance(tts_result, Exception) and tts_result:
            entry["tts"] = tts_result  # Just filename, no path prefix
        else:
            entry["tts"] = None
    
    return entries


async def run_roundtable(tts_enabled=True, topic_type="government_jobs", custom_topic=None):
    """
    Run a roundtable discussion.
    
    Args:
        tts_enabled: Enable text-to-speech
        topic_type: "government_jobs", "travel", "tech_startup", "personal_finance", "mental_health", "custom", or "essential"
        custom_topic: Custom topic string when topic_type is "custom"
    """
    if topic_type == "travel":
        return await run_travel_roundtable(tts_enabled)
    elif topic_type == "tech_startup":
        return await run_tech_startup_roundtable(tts_enabled)
    elif topic_type == "personal_finance":
        return await run_personal_finance_roundtable(tts_enabled)
    elif topic_type == "mental_health":
        return await run_mental_health_roundtable(tts_enabled)
    elif topic_type == "custom" and custom_topic:
        return await run_custom_roundtable(tts_enabled, custom_topic)
    elif topic_type == "essential" and custom_topic:
        return await run_essential_roundtable(tts_enabled, custom_topic)
    else:
        return await run_government_jobs_roundtable(tts_enabled)


async def run_government_jobs_roundtable(tts_enabled=True):
    topic = "Government Jobs and Exams in India"
    characters = CHARACTERS
    turns = []

    intro = (
        "Welcome to the AI Roundtable. Today we discuss Government Jobs and Exams in India. "
        "Our panel includes an Exam Strategist, a Serving Officer, a Fresh Qualifier, and a Citizen."
    )

    turns.append({
        "speaker": "Moderator",
        "message": intro,
        "tts": None,
    })

    for turn in range(MAX_TURNS):
        prompt = build_government_jobs_prompt(turns, topic, characters)

        response = await call_groq([
            {"role": "system", "content": build_government_jobs_system_prompt(characters)},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)

        # Parallelize TTS for all speakers in this turn
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }


async def run_essential_roundtable(tts_enabled=True, essential_topic=""):
    """
    Run a 40-minute essential topic roundtable with 4 expert speakers.
    
    Args:
        tts_enabled: Enable text-to-speech
        essential_topic: The essential topic provided by the user
    """
    topic = essential_topic
    # Essential topic specialists
    characters = [
        {"name": "Dr. Sarah Chen", "role": "Lead Researcher", "accent": "en-US"},
        {"name": "Prof. Marcus Williams", "role": "Industry Expert", "accent": "en-GB"},
        {"name": "Dr. Elena Rodriguez", "role": "Policy Analyst", "accent": "es-ES"},
        {"name": "James Thompson", "role": "Public Advocate", "accent": "en-US"}
    ]
    
    turns = []
    MAX_ESSENTIAL_TURNS = 16  # More turns for 40-minute discussion

    intro = (
        f"Welcome to this Essential Topics Deep Dive on {topic}. "
        "I'm your moderator, and today we have four distinguished experts: "
        "Dr. Sarah Chen, our lead researcher; Professor Marcus Williams, industry expert; "
        "Dr. Elena Rodriguez, policy analyst; and James Thompson, public advocate. "
        "We'll be exploring this critical topic from multiple perspectives over the next 40 minutes."
    )

    # Generate the extended discussion
    for i in range(MAX_ESSENTIAL_TURNS):
        if i == 0:
            prompt = f"""Create a comprehensive 40-minute roundtable discussion about "{topic}" with 4 expert speakers: Dr. Sarah Chen (Lead Researcher), Prof. Marcus Williams (Industry Expert), Dr. Elena Rodriguez (Policy Analyst), and James Thompson (Public Advocate).

This is an essential topic that everyone should understand. Each speaker should provide deep, expert insights with detailed explanations, real-world examples, and practical implications.

Return your response as a JSON array with this format:
[
    {{"speaker": "Dr. Sarah Chen", "message": "Detailed research-based insights with data and evidence (3-4 sentences)"}},
    {{"speaker": "Prof. Marcus Williams", "message": "Industry perspective with practical examples and market insights (3-4 sentences)"}},
    {{"speaker": "Dr. Elena Rodriguez", "message": "Policy analysis with regulatory and societal implications (3-4 sentences)"}},
    {{"speaker": "James Thompson", "message": "Public advocacy perspective with impact on everyday people (3-4 sentences)"}}
]

Make responses comprehensive and educational."""

        elif i < 6:
            prompt = f"""Continue the essential topic discussion on "{topic}" with the same 4 experts.

Each speaker should:
- Build upon previous points with deeper analysis
- Provide specific examples and case studies
- Address different aspects of the topic
- Keep responses detailed (3-4 sentences)

Return as JSON array:
[
    {{"speaker": "Dr. Sarah Chen", "message": "research insights"}},
    {{"speaker": "Prof. Marcus Williams", "message": "industry perspective"}},
    {{"speaker": "Dr. Elena Rodriguez", "message": "policy analysis"}},
    {{"speaker": "James Thompson", "message": "public impact"}}
]"""

        elif i < 12:
            prompt = f"""Continue the essential topic discussion on "{topic}" with deeper exploration.

Each speaker should:
- Address challenges and solutions
- Discuss future implications
- Provide actionable insights
- Consider global perspectives
- Keep responses detailed (3-4 sentences)

Return as JSON array:
[
    {{"speaker": "Dr. Sarah Chen", "message": "research insights"}},
    {{"speaker": "Prof. Marcus Williams", "message": "industry perspective"}},
    {{"speaker": "Dr. Elena Rodriguez", "message": "policy analysis"}},
    {{"speaker": "James Thompson", "message": "public impact"}}
]"""

        else:
            prompt = f"""Conclude the essential topic discussion on "{topic}" with final insights.

Each speaker should:
- Summarize key takeaways
- Provide future outlook
- Offer practical advice for listeners
- End with thought-provoking insights
- Keep responses detailed (3-4 sentences)

Return as JSON array:
[
    {{"speaker": "Dr. Sarah Chen", "message": "research insights"}},
    {{"speaker": "Prof. Marcus Williams", "message": "industry perspective"}},
    {{"speaker": "Dr. Elena Rodriguez", "message": "policy analysis"}},
    {{"speaker": "James Thompson", "message": "public impact"}}
]"""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an essential educational roundtable discussion with 4 world experts. ALWAYS return your response as a valid JSON array with the exact format specified. Do not include any explanations or text outside the JSON array."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
        "is_essential": True,
        "duration_minutes": 40
    }


async def run_custom_roundtable(tts_enabled=True, custom_topic=""):
    """
    Run a roundtable discussion on a custom topic.
    
    Args:
        tts_enabled: Enable text-to-speech
        custom_topic: The custom topic provided by the user
    """
    topic = custom_topic
    characters = CHARACTERS  # Use default characters for custom topics
    turns = []

    intro = (
        f"Welcome to the AI Roundtable. Today we discuss {topic}. "
        "Our panel includes an Expert Analyst, a Research Specialist, an Industry Professional, and an Enthusiast."
    )

    # Generate the discussion
    for i in range(MAX_TURNS):
        recent = turns[-10:] if len(turns) > 10 else turns
        context = "\n".join(f'{t["speaker"]}: {t["message"]}' for t in recent) if recent else ""

        if i == 0:
            prompt = f"""Start a natural, flowing podcast discussion about "{topic}" with 4 speakers:
- Expert Analyst: data-driven, formal, cites evidence
- Research Specialist: academic, loves nuance, brings surprising facts
- Industry Professional: practical, no-nonsense, talks from real experience
- Enthusiast: passionate, asks the questions the audience is thinking

Rules:
- ANY speaker order — not always the same rotation
- Short reactions count as turns ("Wait, really? That changes things.")
- Speakers reference each other by name
- Mix short bursts with longer points
- Generate 6-8 turns for this opening

Return ONLY a valid JSON array:
[
  {{"speaker": "...", "message": "..."}},
  ...
]"""
        else:
            is_final = (i == MAX_TURNS - 1)
            instruction = (
                "Wrap up. Each speaker gives one final honest takeaway. Keep it real, not polished."
                if is_final else
                "Push the debate forward. Someone disagrees with what was just said. Someone makes it personal with a real example. Not all 4 need to speak."
            )
            prompt = f"""Continue the discussion on "{topic}".

Recent conversation:
{context}

{instruction}

Return ONLY a valid JSON array (any order, 4-8 turns):
[
  {{"speaker": "...", "message": "..."}},
  ...
]"""

        response = await call_groq([
            {"role": "system", "content": "You are producing a natural, unscripted podcast debate. ALWAYS return a valid JSON array only — no markdown, no extra text. Speakers go in any order, have unequal airtime, reference each other, and occasionally crack jokes or push back hard."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }



async def run_travel_roundtable(tts_enabled=True):
    """Run a roundtable discussion about travel destinations."""
    topic = "Travel Destinations and Experiences"
    characters = TRAVEL_CHARACTERS
    turns = []

    intro = (
        f"Welcome to the AI Roundtable. Today we discuss {topic}. "
        "Our panel includes experienced travelers and tourism experts."
    )

    turns.append({
        "speaker": "Moderator",
        "message": intro,
        "tts": None,
    })

    for turn in range(MAX_TURNS):
        if turn == 0:
            prompt = f"""Create a roundtable discussion about "{topic}" with travel experts.
Each person should provide their unique perspective on travel experiences.
Return your response as a JSON array with this format:
[
    {{"speaker": "Travel Expert", "message": "travel insights"}},
    {{"speaker": "Tourism Professional", "message": "industry perspective"}},
    {{"speaker": "Experienced Traveler", "message": "personal experience"}},
    {{"speaker": "Local Guide", "message": "local insights"}}
]

Keep responses concise but informative (2-3 sentences each)."""
        else:
            prompt = f"""Continue the travel discussion about "{topic}".
Build upon previous points. Each speaker should:
- React to what others said
- Add new insights or ask questions
- Keep responses concise (2-3 sentences each)

Return as JSON array with the same format."""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an engaging travel discussion with experts. Always return your response as a valid JSON array."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }

async def run_tech_startup_roundtable(tts_enabled=True):
    """Run a roundtable discussion about tech startups."""
    topic = "Tech Startups and Innovation"
    characters = TECH_STARTUP_CHARACTERS
    turns = []

    intro = (
        f"Welcome to the AI Roundtable. Today we discuss {topic}. "
        "Our panel includes startup founders and tech experts."
    )

    turns.append({
        "speaker": "Moderator",
        "message": intro,
        "tts": None,
    })

    for turn in range(MAX_TURNS):
        if turn == 0:
            prompt = f"""Create a roundtable discussion about "{topic}" with tech startup experts.
Each person should provide their unique perspective on startups and innovation.
Return your response as a JSON array with this format:
[
    {{"speaker": "Startup Founder", "message": "founder perspective"}},
    {{"speaker": "VC Investor", "message": "investment insights"}},
    {{"speaker": "Tech Expert", "message": "technical perspective"}},
    {{"speaker": "Product Manager", "message": "product insights"}}
]

Keep responses concise but informative (2-3 sentences each)."""
        else:
            prompt = f"""Continue the tech startup discussion about "{topic}".
Build upon previous points. Each speaker should:
- React to what others said
- Add new insights or ask questions
- Keep responses concise (2-3 sentences each)

Return as JSON array with the same format."""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an engaging tech startup discussion with experts. Always return your response as a valid JSON array."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }

async def run_personal_finance_roundtable(tts_enabled=True):
    """Run a roundtable discussion about personal finance."""
    topic = "Personal Finance and Wealth Management"
    characters = PERSONAL_FINANCE_CHARACTERS
    turns = []

    intro = (
        f"Welcome to the AI Roundtable. Today we discuss {topic}. "
        "Our panel includes finance experts and financial advisors."
    )

    turns.append({
        "speaker": "Moderator",
        "message": intro,
        "tts": None,
    })

    for turn in range(MAX_TURNS):
        if turn == 0:
            prompt = f"""Create a roundtable discussion about "{topic}" with personal finance experts.
Each person should provide their unique perspective on financial management.
Return your response as a JSON array with this format:
[
    {{"speaker": "Financial Advisor", "message": "advice"}},
    {{"speaker": "Investment Expert", "message": "investment insights"}},
    {{"speaker": "Tax Specialist", "message": "tax perspective"}},
    {{"speaker": "Budget Coach", "message": "budgeting tips"}}
]

Keep responses concise but informative (2-3 sentences each)."""
        else:
            prompt = f"""Continue the personal finance discussion about "{topic}".
Build upon previous points. Each speaker should:
- React to what others said
- Add new insights or ask questions
- Keep responses concise (2-3 sentences each)

Return as JSON array with the same format."""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an engaging personal finance discussion with experts. Always return your response as a valid JSON array."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }

async def run_mental_health_roundtable(tts_enabled=True):
    """Run a roundtable discussion about mental health."""
    topic = "Mental Health and Wellness"
    characters = MENTAL_HEALTH_CHARACTERS
    turns = []

    intro = (
        f"Welcome to the AI Roundtable. Today we discuss {topic}. "
        "Our panel includes mental health professionals and wellness experts."
    )

    turns.append({
        "speaker": "Moderator",
        "message": intro,
        "tts": None,
    })

    for turn in range(MAX_TURNS):
        if turn == 0:
            prompt = f"""Create a roundtable discussion about "{topic}" with mental health experts.
Each person should provide their unique perspective on mental health and wellness.
Return your response as a JSON array with this format:
[
    {{"speaker": "Psychologist", "message": "psychological insights"}},
    {{"speaker": "Therapist", "message": "therapy perspective"}},
    {{"speaker": "Wellness Coach", "message": "wellness advice"}},
    {{"speaker": "Mental Health Advocate", "message": "advocacy perspective"}}
]

Keep responses concise but informative (2-3 sentences each)."""
        else:
            prompt = f"""Continue the mental health discussion about "{topic}".
Build upon previous points. Each speaker should:
- React to what others said
- Add new insights or ask questions
- Keep responses concise (2-3 sentences each)

Return as JSON array with the same format."""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an engaging mental health discussion with experts. Always return your response as a valid JSON array."},
            {"role": "user", "content": prompt},
        ])

        parsed = normalize_responses(parse_responses(response), characters)
        parsed = attach_accents(parsed, characters)
        parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turns.append({
                "speaker": entry["speaker"],
                "message": entry["message"],
                "tts": entry.get("tts"),
            })

    return {
        "topic": topic,
        "turns": turns,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  STREAMING GENERATOR
#  Yields one turn at a time so the frontend can start playing immediately.
#  First audio arrives in ~10 seconds instead of waiting 5+ minutes.
# ─────────────────────────────────────────────────────────────────────────────

def _build_stream_prompt(history: list, topic: str, round_num: int) -> str:
    speakers_info = """The 4 speakers and their personalities:
- The Expert: cites facts and data, slightly formal, uses phrases like "Research shows..." or "The data is clear..."
- The Skeptic: challenges everything, sarcastic but sharp, uses phrases like "Hold on—" or "That's a stretch..."
- The Optimist: enthusiastic, uses analogies, finds the silver lining, uses phrases like "But think about it this way..."
- The Pragmatist: cuts through theory, blunt, asks "But what does this actually mean for real people?"
"""

    if round_num == 0:
        return f"""Start a natural, flowing podcast discussion about: "{topic}"

{speakers_info}

Rules for the conversation:
- Speakers can go in ANY order — not always Expert first
- A speaker can react briefly ("Ha — exactly!" counts as a turn)
- Speakers reference each other by name ("The Skeptic raised a fair point...")
- NOT all 4 need to speak every time — let it flow naturally
- Mix short reactions with longer points
- Generate 6 to 8 turns total for this opening exchange

Return ONLY a valid JSON array (any order, any length):
[
  {{"speaker": "The Expert", "message": "..."}},
  {{"speaker": "The Skeptic", "message": "..."}},
  ...
]"""

    recent = history[-10:] if len(history) > 10 else history
    context = "\n".join(f'{t["speaker"]}: {t["message"]}' for t in recent)
    is_final = (round_num == MAX_TURNS - 1)

    if is_final:
        instruction = "Wrap it up naturally. Each speaker gives their final take — one honest insight or actionable point. Let The Skeptic have the last word with something unexpectedly agreeable."
    else:
        instruction = "Continue the argument. Someone disagrees sharply. Someone makes a joke. Someone brings a surprising real-world example. Keep the energy uneven — not everyone gets equal airtime."

    return f"""Continue the podcast discussion on: "{topic}"

Recent conversation:
{context}

{speakers_info}

{instruction}

Rules:
- ANY order, NOT fixed rotation
- Short reactions are fine ("Come on, that's not the whole story.")
- Reference each other by name
- 5 to 8 turns this round

Return ONLY a valid JSON array:
[
  {{"speaker": "...", "message": "..."}},
  ...
]"""


async def run_roundtable_streaming(topic: str, tts_enabled: bool = True):
    """
    Async generator — yields one turn dict at a time as soon as it's ready.
    Each yield: {"speaker", "message", "tts" (filename|None), "turn_index"}
    Frontend plays turn 0 the moment it arrives (~10 sec). Rest streams in.
    """
    history = []
    turn_index = 0

    system_prompt = (
        "You are producing a premium podcast with 4 distinct personalities having a real argument. "
        "ALWAYS return a valid JSON array only — no extra text, no markdown, no explanation. "
        "The conversation must feel unscripted: unequal airtime, interruptions, short reactions, "
        "speakers referencing each other by name, disagreements, occasional jokes. "
        "Never rotate speakers in a fixed 1-2-3-4 pattern. Let the conversation breathe."
    )

    for round_num in range(MAX_TURNS):
        prompt = _build_stream_prompt(history, topic, round_num)

        try:
            response = await call_groq(
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.85,
                max_tokens=1200,
            )
        except Exception as e:
            print(f"[stream] Groq error on round {round_num}: {e}")
            break

        parsed = normalize_responses(parse_responses(response), STREAM_CHARACTERS)
        parsed = attach_accents(parsed, STREAM_CHARACTERS)

        if tts_enabled:
            parsed = await generate_tts_batch(parsed, tts_enabled)

        for entry in parsed:
            turn = {
                "speaker":    entry["speaker"],
                "message":    entry["message"],
                "tts":        entry.get("tts"),
                "turn_index": turn_index,
            }
            history.append(turn)
            turn_index += 1
            yield turn
