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

// Function to fetch readings using fetch with JSONP simulation
export async function fetchReadings(): Promise<ReadingData> {
  return new Promise<ReadingData>((resolve, reject) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;
    
    // For React Native, we'll need to use a proxy or CORS-enabled endpoint
    // This is a simplified version - in production, you'd need a backend proxy
    const url = `https://universalis.com/United.States/${formattedDate}/jsonpmass.js`;
    
    // Since React Native doesn't support JSONP directly, we'll simulate the response
    // In a real app, you'd need to implement a backend proxy or use a CORS-enabled API
    setTimeout(() => {
      // Mock data for demonstration - replace with actual API call through proxy
      const mockData: ReadingData = {
        date: formattedDate,
        day: "Ordinary Time",
        Mass_R1: {
          source: "First Reading Reference",
          text: "First reading text content..."
        },
        Mass_Ps: {
          source: "Psalm Reference", 
          text: "Psalm text content..."
        },
        Mass_G: {
          source: "Gospel Reference",
          text: "Gospel text content..."
        },
        Mass_GA: {
          source: "Gospel Acclamation",
          text: "Alleluia..."
        },
        copyright: {
          text: "Copyright notice"
        }
      };
      resolve(mockData);
    }, 1000);
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
  'AIzaSyBNyXVjf3Dy0YC7kA3X3cxW5rA5L4M3TRQ',
  'AIzaSyAG2x0duV-k1cnZqSdnsccRIzPeQyUtXIA'
];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

async function callGeminiWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextApiKey();
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
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
        const errorText = await response.text();
        if (response.status === 404) {
          throw new Error(`Gemini API 404 Error: The API endpoint was not found. Please ensure:
1. The Generative Language API is enabled in your Google Cloud Console
2. Your API keys are valid and active
3. Billing is enabled for your Google Cloud project
4. If using API key restrictions, add your domain to allowed referrers`);
        }
        throw new Error(`Gemini API error: ${response.statusText} (Status: ${response.status}) - ${errorText}`);
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

    // Clean the response by removing markdown code blocks and other formatting
    const cleanedText = generatedText
      .replace(/```json\s*/gi, '')  // Remove ```json
      .replace(/```\s*/g, '')       // Remove closing ```
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .trim();

    // More robust JSON extraction
    let jsonString = '';
    let parsedContent;
    
    // Try to find and extract valid JSON
    const firstBraceIndex = cleanedText.indexOf('{');
    if (firstBraceIndex === -1) {
      throw new Error('No JSON object found in Gemini response');
    }
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = firstBraceIndex; i < cleanedText.length; i++) {
      if (cleanedText[i] === '{') {
        braceCount++;
      } else if (cleanedText[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      throw new Error('Could not find complete JSON object in Gemini response');
    }
    
    jsonString = cleanedText.substring(firstBraceIndex, endIndex + 1).trim();
    
    try {
      parsedContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw response:', generatedText);
      console.error('Cleaned text:', cleanedText);
      console.error('Extracted JSON string:', jsonString);
      throw new Error(`Failed to parse JSON from Gemini response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
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
    // Re-throw the error to allow proper error handling in the UI
    throw error;
  }
}

export async function getDailyReading(input: DailyReadingInput): Promise<DailyReadingOutput> {
  // 1. Fetch the exact readings using the API
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