// All API calls to the FastAPI backend

export const getEpisodes = () =>
  fetch('/api/episodes').then(r => {
    if (!r.ok) throw new Error('Failed to fetch episodes');
    return r.json();
  });

export const getEpisode = (id) =>
  fetch(`/api/episodes/${id}`).then(r => {
    if (!r.ok) throw new Error('Episode not found');
    return r.json();
  });

export const generateEpisode = (topic) =>
  fetch(`/generate?tts=true&topic=${encodeURIComponent(topic)}`, {
    method: 'POST',
  }).then(r => {
    if (!r.ok) throw new Error('Failed to generate episode');
    return r.json();
  });

export const getPopularTopics = () =>
  fetch('/api/topics/popular').then(r => {
    if (!r.ok) throw new Error('Failed to fetch topics');
    return r.json();
  });

export const generateQuiz = (topic, difficulty = 'medium', num_questions = 5) =>
  fetch('/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, num_questions }),
  }).then(r => {
    if (!r.ok) throw new Error('Failed to generate quiz');
    return r.json();
  });

export const submitQuiz = (data) =>
  fetch('/api/quiz/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) throw new Error('Failed to submit quiz');
    return r.json();
  });

// Utility: map topic to gradient color pair
export function topicGradient(topic = '') {
  const t = topic.toLowerCase();
  if (t.includes('finance') || t.includes('money') || t.includes('stock') || t.includes('crypto') || t.includes('economy'))
    return ['#F59E0B', '#EF4444'];
  if (t.includes('tech') || t.includes('ai') || t.includes('artificial') || t.includes('software') || t.includes('data'))
    return ['#3B82F6', '#8B5CF6'];
  if (t.includes('health') || t.includes('mental') || t.includes('wellness') || t.includes('fitness') || t.includes('nutrition'))
    return ['#10B981', '#3B82F6'];
  if (t.includes('travel') || t.includes('tourism') || t.includes('culture'))
    return ['#06B6D4', '#10B981'];
  if (t.includes('government') || t.includes('politics') || t.includes('democracy') || t.includes('law'))
    return ['#EF4444', '#F59E0B'];
  if (t.includes('space') || t.includes('science') || t.includes('physics') || t.includes('astro'))
    return ['#6366F1', '#8B5CF6'];
  if (t.includes('music') || t.includes('art') || t.includes('film') || t.includes('creative'))
    return ['#EC4899', '#F59E0B'];
  if (t.includes('sport') || t.includes('football') || t.includes('cricket') || t.includes('game'))
    return ['#10B981', '#F59E0B'];
  if (t.includes('climate') || t.includes('environment') || t.includes('energy') || t.includes('renewable'))
    return ['#10B981', '#06B6D4'];
  if (t.includes('education') || t.includes('learning') || t.includes('school'))
    return ['#8B5CF6', '#EC4899'];
  return ['#7C3AED', '#EC4899']; // default brand gradient
}

// Build a CSS gradient string from a topic
export function topicGradientCss(topic = '', deg = 135) {
  const [c1, c2] = topicGradient(topic);
  return `linear-gradient(${deg}deg, ${c1}, ${c2})`;
}
