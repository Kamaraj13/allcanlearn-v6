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
from app.piper_tts_client import speak_text  # Back to original working TTS

MAX_TURNS = 8  # Increased for better quality discussions
MAX_ESSENTIAL_TURNS = 20  # Extended Essential Topics for deeper content


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
        if i == 0:
            prompt = f"""Create a roundtable discussion about "{topic}" with 4 speakers: Expert Analyst, Research Specialist, Industry Professional, and Enthusiast.

Each person should provide their unique perspective on {topic}. Make it engaging and informative.

Return your response as a JSON array with this format:
[
    {{"speaker": "Expert Analyst", "message": "their message"}},
    {{"speaker": "Research Specialist", "message": "their message"}},
    {{"speaker": "Industry Professional", "message": "their message"}},
    {{"speaker": "Enthusiast", "message": "their message"}}
]

Keep responses concise but insightful (2-3 sentences each)."""

        else:
            prompt = f"""Continue the roundtable discussion about "{topic}" with the same 4 speakers.

Build upon the previous points. Each speaker should:
- React to what others said
- Add new insights or ask questions
- Keep responses concise (2-3 sentences each)

Return your response as a JSON array with this format:
[
    {{"speaker": "Expert Analyst", "message": "their message"}},
    {{"speaker": "Research Specialist", "message": "their message"}},
    {{"speaker": "Industry Professional", "message": "their message"}},
    {{"speaker": "Enthusiast", "message": "their message"}}
]"""

        response = await call_groq([
            {"role": "system", "content": "You are facilitating an engaging roundtable discussion with 4 experts discussing various perspectives on a topic. Always return your response as a valid JSON array."},
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


