import { NextResponse } from 'next/server';

// --- THE MAIN API HANDLER (App Router Syntax) ---
export async function POST(req) {
  try {
    // 1. PARSE INCOMING TEXT PROMPT
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ message: 'A text prompt is required.' }, { status: 400 });
    }

    // 2. PREPARE AND CALL GEMINI
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // Provide the current date to help the AI understand relative terms like "tomorrow"
    const currentDate = new Date().toISOString();

    const systemPrompt = `
      You are an expert scheduling assistant. Your task is to convert a natural language description of a work shift into a structured JSON object.
      The user will provide a text description. You must extract the relevant details and format them according to the provided schema.

      The current date is ${currentDate}. Use this for calculating relative dates like "next Monday" or "tomorrow".

      The required JSON output schema is:
      {
        "userId": "string", // Extract the user's name and format it as 'FirstName L.'. You will not know the ID.
        "shiftDate": "ISO 8601 DateTime",
        "startTime": "ISO 8601 DateTime",
        "endTime": "ISO 8601 DateTime",
        "isRecurring": "boolean",
        "recurrenceRule": "string | null", // e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR"
        "notes": "string | null"
      }
      
      - For userId, use the name found in the prompt.
      - Combine the extracted date and time to create full ISO 8601 timestamps for startTime and endTime.
      - Set isRecurring to true if the prompt mentions recurrence (e.g., "every Monday").
      - If recurrence is detected, formulate an iCalendar RRule string for recurrenceRule.
      - Any extra information should be added to the notes field.

      Only output the raw JSON object. Do not include any other text or markdown formatting.
    `;

    const geminiPayload = {
      contents: [{
        role: "user",
        parts: [{ text: `Here is the shift to schedule: "${prompt}"` }]
      }],
      systemInstruction: {
        role: "model",
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
          responseMimeType: "application/json",
      }
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
        const errorBody = await geminiRes.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error('The AI failed to generate a valid shift.');
    }

    const geminiData = await geminiRes.json();
    const jsonText = geminiData.candidates[0].content.parts[0].text;
    const parsedJson = JSON.parse(jsonText);

    // 3. SEND THE STRUCTURED JSON BACK TO THE FRONTEND
    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}