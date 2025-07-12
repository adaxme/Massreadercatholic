import { z } from 'zod';

// Input for the entire operation
const DailyReadingInputSchema = z.object({
  language: z
    .string()
    .describe('The language for the generated content. E.g., English, Spanish, Italian, German.'),
});
export type DailyReadingInput = z.infer<typeof DailyReadingInputSchema>;

// Data structure from Universalis API
interface ReadingData {
  date: string;
  day: string;
  Mass_R1: { source: string; text: string };
  Mass_Ps: { source: string; text: string };
  Mass_R2?: { source: string; text: string };
  Mass_GA: { source: string; text: string };
  Mass_G: { source: string; text: string };
  copyright: { text: string };
}

// Final output structure for the UI
const DailyReadingOutputSchema = z.object({
  date: z.string().describe("Today's date in a readable format, e.g., 'July 26, 2024'."),
  feast: z.string().describe('The name of the feast or liturgical day.'),
  saintOfTheDay: z.object({
    name: z.string().describe('The name of the saint of the day.'),
    biography: z.string().describe('A brief, inspiring biography of the saint.'),
  }),
  firstReading: z.object({
    reference: z.string().describe("The biblical reference for the First Reading."),
    text: z.string().describe('The full text of the First Reading.'),
  }),
  responsorialPsalm: z.object({
    reference: z.string().describe("The biblical reference for the Responsorial Psalm."),
    text: z.string().describe('The full text of the Responsorial Psalm.'),
  }),
  gospel: z.object({
    reference: z.string().describe("The biblical reference for the Gospel."),
    text: z.string().describe('The full text of the Gospel reading.'),
  }),
  homily: z.string().describe('A homily based on the readings that is theologically rich, mystical in nature, and has an academic tone.'),
});
export type DailyReadingOutput = z.infer<typeof DailyReadingOutputSchema>;

// Function to fetch readings using JSONP
export async function fetchReadings(): Promise<ReadingData> {
  return new Promise<ReadingData>((resolve, reject) => {
    const script = document.createElement('script');
    const uniqueCallbackName = 'universalisCallback';

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;
    const url = `https://universalis.com/United.States/${formattedDate}/jsonpmass.js`;

    script.src = `${url}?callback=${uniqueCallbackName}`;

    // Define the callback function with the type `ReadingData`
    (window as any)[uniqueCallbackName] = (data: ReadingData) => {
      resolve(data);
      // Clean up: remove the script and callback
      delete (window as any)[uniqueCallbackName];
      document.body.removeChild(script);
    };

    // Handle JSONP script loading errors
    script.onerror = () => {
      reject(new Error(`JSONP request to ${url} failed`));
      delete (window as any)[uniqueCallbackName];
      document.body.removeChild(script);
    };

    document.body.appendChild(script);
  });
}

/**
 * Strips all HTML tags from a string and cleans up entities.
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#x2010;/g, '-')
    .replace(/&#160;/g, ' ')
    .replace(/\s\s+/g, ' ')
    .trim();
}

/**
 * Formats reading text by converting divs to newlines for paragraphs and cleaning entities.
 */
function formatReadingText(html: string): string {
  if (!html) return '';
  return (
    html
      .replace(/<div[^>]*>/g, '\n') // Treat divs as paragraph breaks
      .replace(/<[^>]*>/g, '') // Remove all other tags
      .replace(/&#x2010;/g, '-') // Hyphen
      .replace(/&#160;/g, ' ') // Non-breaking space
      .replace(/\n\s*\n/g, '\n') // Collapse multiple blank lines
      .trim()
  );
}

// Gemini AI service integration
const GEMINI_API_KEYS = [
  'AIzaSyAH7AWzhP1pf_9StgZs89aTEv_vUeq3XxU',
  'AIzaSyBNyXVjf3Dy0YC7kA3X3cxW5rA5L4M3TRQ'
];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

async function callGeminiWithRetry(prompt: string, maxRetries: number = 2): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextApiKey();
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText} (Status: ${response.status})`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No content generated from Gemini API');
      }

      return generatedText;
    } catch (error) {
      console.warn(`API attempt ${attempt + 1} failed with key ending in ...${apiKey.slice(-4)}:`, error);
      lastError = error as Error;
      
      // If this is a rate limit error or quota exceeded, try the next key immediately
      if (error instanceof Error && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('rate limit')
      )) {
        continue;
      }
      
      // For other errors, wait a bit before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('All API key attempts failed');
}

async function generateContentWithGemini(input: {
  language: string;
  feastDay: string;
  firstReadingText: string;
  psalmText: string;
  gospelText: string;
}): Promise<{
  feast: string;
  saintOfTheDay: { name: string; biography: string };
  firstReadingText: string;
  responsorialPsalmText: string;
  gospelText: string;
  homily: string;
}> {
  const prompt = `You are a Catholic theologian and scholar. Based on the following liturgical information, please provide a comprehensive response in ${input.language}:

FEAST DAY: ${input.feastDay}
FIRST READING: ${input.firstReadingText}
PSALM: ${input.psalmText}
GOSPEL: ${input.gospelText}

Please provide the following in valid JSON format:
{
  "feast": "The feast day name in ${input.language}",
  "saintOfTheDay": {
    "name": "Name of a relevant saint for today",
    "biography": "A brief, inspiring biography of the saint (2-3 sentences)"
  },
  "firstReadingText": "The first reading text translated to ${input.language} if needed",
  "responsorialPsalmText": "The psalm text translated to ${input.language} if needed", 
  "gospelText": "The gospel text translated to ${input.language} if needed",
  "homily": "A theologically rich, mystical homily based on the readings (3-4 paragraphs)"
}

Ensure all content is appropriate for Catholic liturgy and theologically sound.`;

  try {
    const generatedText = await callGeminiWithRetry(prompt);

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const parsedContent = JSON.parse(jsonMatch[0]);
    
    return {
      feast: parsedContent.feast || input.feastDay,
      saintOfTheDay: {
        name: parsedContent.saintOfTheDay?.name || "Saint of the Day",
        biography: parsedContent.saintOfTheDay?.biography || "A holy person dedicated to God's service."
      },
      firstReadingText: parsedContent.firstReadingText || input.firstReadingText,
      responsorialPsalmText: parsedContent.responsorialPsalmText || input.psalmText,
      gospelText: parsedContent.gospelText || input.gospelText,
      homily: parsedContent.homily || "Today's readings invite us to deeper contemplation of God's love and mercy."
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback to original content if AI fails
    return {
      feast: input.feastDay,
      saintOfTheDay: {
        name: "Saint of the Day",
        biography: "A holy person dedicated to serving God and others through prayer, sacrifice, and good works."
      },
      firstReadingText: input.firstReadingText,
      responsorialPsalmText: input.psalmText,
      gospelText: input.gospelText,
      homily: "Today's readings invite us to contemplate the profound mystery of God's love manifested in our daily lives. Through prayer and reflection on these sacred texts, we are called to deeper union with Christ and service to our neighbors."
    };
  }
}

export async function getDailyReading(input: DailyReadingInput): Promise<DailyReadingOutput> {
  // 1. Fetch the exact readings using JSONP
  const readingsData = await fetchReadings();

  // 2. Prepare the input for the AI
  const promptInput = {
    language: input.language,
    feastDay: stripHtml(readingsData.day),
    firstReadingText: formatReadingText(readingsData.Mass_R1.text),
    psalmText: formatReadingText(readingsData.Mass_Ps.text),
    gospelText: formatReadingText(readingsData.Mass_G.text),
  };
  
  // 3. Call Gemini AI to translate and generate content
  const aiContent = await generateContentWithGemini(promptInput);
  
  // 4. Combine the fetched references and the AI-generated content into the final response
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    date: formattedDate,
    feast: aiContent.feast,
    firstReading: {
      reference: stripHtml(readingsData.Mass_R1.source),
      text: aiContent.firstReadingText,
    },
    responsorialPsalm: {
      reference: stripHtml(readingsData.Mass_Ps.source),
      text: aiContent.responsorialPsalmText,
    },
    gospel: {
      reference: stripHtml(readingsData.Mass_G.source),
      text: aiContent.gospelText,
    },
    saintOfTheDay: aiContent.saintOfTheDay,
    homily: aiContent.homily,
  };
}