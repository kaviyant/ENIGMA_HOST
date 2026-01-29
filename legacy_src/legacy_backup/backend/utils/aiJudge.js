// const fetch = require('node-fetch'); // Native fetch used (Node 18+)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ---------- PROMPT COMPARISON ---------- */
/* ---------- PROMPT COMPARISON ---------- */
/* ---------- PROMPT COMPARISON ---------- */
// Args: 
// - userSubmission: The user's input
// - context: The question or the context of the image
// - comparisonTarget: The correct answer or prompt
async function TextScore(userSubmission, question, correctAnswer) {
    if (!GROQ_API_KEY) return JSON.stringify({ score: 0, reason: "API Key Missing" });

    const content = `You are a strict but fair judge for a text-based knowledge game.
    Return ONLY a JSON object: { "score": <0-100>, "reason": "<brief explanation>" }.
    
    TASK: Evaluate the User's Answer against the Correct Answer.
    - Question: "${question}"
    - Correct Answer: "${correctAnswer}"
    - User's Answer: "${userSubmission}"
    
    SCORING GUIDE:
    - 100: Perfect match in meaning and detail.
    - 80-99: Correct meaning, minor phrasing differences.
    - 50-79: Partially correct or missing key details.
    - 0-49: Incorrect or irrelevant.
    
    Be objective. Ignore spelling mistakes if the meaning is clear.`;

    return await getGroqResponse(content);
}

async function ImagePromptScore(userSubmission, correctPrompt) {
    if (!GROQ_API_KEY) return JSON.stringify({ score: 0, reason: "API Key Missing" });

    const content = `You are an AI Judge for an image generation reverse-engineering game.
    Return ONLY a JSON object: { "score": <0-100>, "reason": "<brief explanation>" }.
    
    TASK: Compare the User's Prompt with the Correct Prompt.
    - Correct Prompt (The prompt that created the image): "${correctPrompt}"
    - User's Prompt (The user's attempt to guess it): "${userSubmission}"
    
    SCORING GUIDE:
    - 90-100: Almost identical meaning, keywords, and style.
    - 70-89: Captures the main subject and style well.
    - 40-69: Gets the subject right but misses the style or details.
    - 0-39: Completely wrong subject or unrelated.
    
    Ignore minor phrasing differences, focus on semantic similarity.`;

    return await getGroqResponse(content);
}

// Wrapper for backward compatibility if needed, but we will update server.js
async function EnigmaScore(userSubmission, questionContext, correctPrompt) {
    // Determine if this is a Text Round (Question provided) or Image Round
    // However, server.js uses it for both.
    // If questionContext is "Describe the image...", it's Image Round.
    if (questionContext.includes("Describe the image")) {
        return await ImagePromptScore(userSubmission, correctPrompt);
    } else {
        return await TextScore(userSubmission, questionContext, correctPrompt);
    }
}

/* ---------- GROQ CALL ---------- */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function getGroqResponse(content) {
    try {
        const response = await fetch(
            GROQ_API_URL,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content }],
                    temperature: 0
                })
            }
        );

        const data = await response.json();
        if (data.error) {
            console.error("Groq API Error:", data.error);
            return JSON.stringify({ score: 0, reason: "AI Service Error" });
        }
        return data.choices?.[0]?.message?.content || "{}";
    } catch (e) {
        console.error("Fetch Error:", e);
        return JSON.stringify({ score: 0, reason: "Network Error" });
    }
}

module.exports = { EnigmaScore, PixelScore };

/* ---------- PIXEL SCORE (Round 2) ---------- */
async function PixelScore(userCode) {
    if (!GROQ_API_KEY) {
        return JSON.stringify({ score: 0, reason: "Server Configuration Error: API Key Missing" });
    }

    const content = 'You are an expert web development judge. Evaluate HTML/CSS code based on: creativity (35%), design aesthetics (25%), code quality (10%), responsiveness potential (15%), and innovation (15%). Return ONLY a JSON object with format: {"score": <number 0-100>, "feedback": "<brief evaluation>"} heres the user code ' + userCode;

    return await getGroqResponse(content);
}
