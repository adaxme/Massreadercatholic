'use server';
/**
 * @fileOverview A flow for generating daily Catholic Mass readings, a homily, and saint of the day.
 *
 * - getDailyReading - A function that fetches the daily content.
 * - DailyReadingInput - The input type for the getDailyReading function.
 * - DailyReadingOutput - The return type for the getDailyReading function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input for the entire operation
const DailyReadingInputSchema = z.object({
  language: z
    .string()
    .describe('The language for the generated content. E.g., English, Spanish, Italian, German.'),
});
export type DailyReadingInput = z.infer<typeof DailyReadingInputSchema>;

// Data structure from Universalis API
const UniversalisReadingSchema = z.object({
  source: z.string(),
  text: z.string(),
});
const UniversalisDataSchema = z.object({
  date: z.string(),
  day: z.string(),
  Mass_R1: UniversalisReadingSchema,
  Mass_Ps: UniversalisReadingSchema,
  Mass_R2: UniversalisReadingSchema.optional(),
  Mass_GA: UniversalisReadingSchema,
  Mass_G: UniversalisReadingSchema,
  copyright: z.object({ text: z.string() }),
});
type UniversalisData = z.infer<typeof UniversalisDataSchema>;

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

export async function getDailyReading(input: DailyReadingInput): Promise<DailyReadingOutput> {
  return getDailyReadingFlow(input);
}

// Function to fetch and parse data from Universalis
async function fetchReadingsFromUniversalis(): Promise<UniversalisData> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}${month}${day}`;
  const url = `https://universalis.com/United.States/${formattedDate}/jsonpmass.js?callback=universalisCallback`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch readings from Universalis: ${response.statusText}`);
  }
  let text = await response.text();
  
  // Strip JSONP callback wrapper
  const startIndex = text.indexOf('(');
  const endIndex = text.lastIndexOf(')');
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Invalid JSONP response format from Universalis');
  }
  text = text.substring(startIndex + 1, endIndex);

  const data = JSON.parse(text);
  return UniversalisDataSchema.parse(data);
}


// Schema for the data we send to the AI prompt
const AiProcessingInputSchema = z.object({
    language: z.string(),
    feastDay: z.string(),
    firstReadingText: z.string(),
    psalmText: z.string(),
    gospelText: z.string(),
});

// Schema for what we expect back from the AI, including translations
const AiOutputSchema = z.object({
    feast: z.string().describe('The translated name of the feast or liturgical day.'),
    saintOfTheDay: z.object({
        name: z.string().describe('The translated name of the saint of the day.'),
        biography: z.string().describe('A brief, inspiring biography of the saint, translated into the requested language.'),
    }),
    firstReadingText: z.string().describe('The translated full text of the First Reading, with paragraphs.'),
    responsorialPsalmText: z.string().describe('The translated full text of the Responsorial Psalm, with paragraphs.'),
    gospelText: z.string().describe('The translated full text of the Gospel reading, with paragraphs.'),
    homily: z.string().describe('A homily based on the readings that is theologically rich, mystical in nature, and has an academic tone, in the requested language.'),
});

const contentGenerationPrompt = ai.definePrompt({
    name: 'contentGenerationPrompt',
    input: { schema: AiProcessingInputSchema },
    output: { schema: AiOutputSchema },
    prompt: `You are an expert in Catholic theology, liturgy, hagiography, and translation.
Your entire response, including all text fields in the output JSON, must be in the language: {{{language}}}.

The content to be translated and processed is for the feast of: {{{feastDay}}}.

Please perform the following tasks:
1.  **Format and Translate Content**: If the requested language is 'English', return the original English text but ensure it is well-formatted with proper paragraphs. Otherwise, translate the feast day name and all provided scripture readings into the target language, also ensuring the output is well-formatted with paragraphs.
2.  **Generate a Homily**: Based on the readings, write a homily in the target language. It should be theologically rich, deeply mystical, and maintain a scholarly, academic tone.
3.  **Identify the Saint of the Day**: Provide the saint for today's feast. Include their name and a brief, inspiring biography in the target language.

**English Source Content:**
- **Feast Day**: {{{feastDay}}}
- **First Reading**: {{{firstReadingText}}}
- **Responsorial Psalm**: {{{psalmText}}}
- **Gospel**: {{{gospelText}}}

Please provide the final translated texts and generated content in the specified JSON format. Biblical references (like 'Matthew 10:1-7') are not provided and should not be part of the output text.`,
});

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


const getDailyReadingFlow = ai.defineFlow(
  {
    name: 'getDailyReadingFlow',
    inputSchema: DailyReadingInputSchema,
    outputSchema: DailyReadingOutputSchema,
  },
  async ({ language }) => {
    // 1. Fetch the exact readings from Universalis
    const universalisData = await fetchReadingsFromUniversalis();

    // 2. Prepare the input for the AI
    const promptInput = {
      language,
      // Pass the cleaned feast day and readings to the AI
      feastDay: stripHtml(universalisData.day),
      firstReadingText: formatReadingText(universalisData.Mass_R1.text),
      psalmText: formatReadingText(universalisData.Mass_Ps.text),
      gospelText: formatReadingText(universalisData.Mass_G.text),
    };
    
    // 3. Call the AI to translate and generate content
    const { output: aiContent } = await contentGenerationPrompt(promptInput);

    if (!aiContent) {
        throw new Error("AI failed to generate content.");
    }
    
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
        reference: stripHtml(universalisData.Mass_R1.source),
        text: aiContent.firstReadingText,
      },
      responsorialPsalm: {
        reference: stripHtml(universalisData.Mass_Ps.source),
        text: aiContent.responsorialPsalmText,
      },
      gospel: {
        reference: stripHtml(universalisData.Mass_G.source),
        text: aiContent.gospelText,
      },
      saintOfTheDay: aiContent.saintOfTheDay,
      homily: aiContent.homily,
    };
  }
);
