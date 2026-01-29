const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function calcInternal(target_prompt: string, user_input: string, is_image_task = false, reference_result = "") {
    if (!GROQ_API_KEY) return JSON.stringify({ score: 0, reason: "API Key Missing" });

    const resultContext = (!is_image_task && reference_result)
        ? `Result: "${reference_result}". Compare the USER_PROMPT's ability to achieve similar semantic depth.`
        : `Note: This is an image generation task. Do not expect a result text/binary. Judge the USER_PROMPT solely on its technical keywords, style, and descriptive potential compared to the TARGET_PROMPT.`;

    const body = `
      Act as a strict competitive judge for a prompt engineering contest.note that if both result and the user prompt are same then provide score 0
      (take this into strong consideration also it must not be a kind of like a part of the result too take strong critical assesment of the result and the userprompt so its fair and right also make sure that the prompt is like a prompt not like the result a main part of the methodology)
      make sure that the reason doesnt reveal information or doenst say what the prompt really is  so the hints are hidden the reason must only be for if the users view lacks description or else provide them with try again or think more about it or something like that 
      provide 100 if both user prompt and the target prompt are very similar like almost identical in nature also if same
      
  
      You will be given two prompts:
      1. TARGET_PROMPT: The ideal prompt that achieves the desired output.
      2. USER_PROMPT: The prompt submitted by a contestant.
      Your task is to evaluate how well the USER_PROMPT aligns with the TARGET_PROMPT in terms of technical detail, style, and ability to generate similar results.
      
  
      TASK TYPE: ${is_image_task ? "IMAGE GENERATION" : "TEXT GENERATION"}
      TARGET_PROMPT: "${target_prompt}"
      USER_PROMPT: "${user_input}"
      ${resultContext}
      if this result is similar to the user prompt then provide score 0
      JUDGING CRITERIA:
      - 100: Perfect. The user prompt is functionally identical or superior in technical detail.
      - 80-99: Strong alignment with minor missing constraints.
      - 40-79: Moderate alignment; captures the "vibe" but lacks specific technical keywords or tone.
      - 0-39: Poor or unrelated.
  
      RULES:
      1. Be very strict. 100 is like somewhat hard to get not too strict.
      2. Ignore conversational fluff in the user's input.
      3. Return ONLY: {"score": number, "reason": "text"} like a json renderer let the reason be very short like 1 line
      4. if both result and the user prompt are same then provide score 0
      5 provide 100 only if the user prompt matches like too similar to the intended prompt
    `;

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
                    messages: [
                        {
                            role: "system",
                            content: "You are a precise impartial judge. Output ONLY valid JSON. No markdown blocks. No other text."
                        },
                        { role: "user", content: body }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
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

export async function EnigmaScore(userSubmission: string, contextOrQuestion: string, correctAnswer: string, type: 'text' | 'image' = 'text') {
    // Adapter matching the existing signature to the new calcInternal logic
    // userSubmission -> user_input
    // contextOrQuestion -> reference_result (Result/Output displayed to user)
    // correctAnswer -> target_prompt (The hidden correct prompt)
    // type -> is_image_task

    return await calcInternal(correctAnswer, userSubmission, type === 'image', contextOrQuestion);
}
