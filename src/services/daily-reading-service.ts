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

// Mock AI service for demonstration - in a real app you'd connect to your AI service
async function generateContentWithAI(input: {
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // For demo purposes, return mock data based on language
  const isEnglish = input.language === 'English';
  
  return {
    feast: isEnglish ? input.feastDay : `${input.feastDay} (${input.language})`,
    saintOfTheDay: {
      name: isEnglish ? "Saint Thomas Aquinas" : `Santo Tomás de Aquino (${input.language})`,
      biography: isEnglish 
        ? "Thomas Aquinas (1225-1274) was an Italian Dominican friar and priest who was an influential philosopher and theologian. He is known for his synthesis of Aristotelian philosophy with Christian theology, particularly in his masterwork 'Summa Theologica'. He is considered one of the greatest theologians in the history of the Catholic Church and was canonized in 1323."
        : `Thomas Aquinas (1225-1274) fue un fraile dominico y sacerdote italiano que fue un filósofo y teólogo influyente. Es conocido por su síntesis de la filosofía aristotélica con la teología cristiana, particularmente en su obra maestra 'Summa Theologica'. Es considerado uno de los más grandes teólogos en la historia de la Iglesia Católica y fue canonizado en 1323. (${input.language})`
    },
    firstReadingText: isEnglish ? input.firstReadingText : `${input.firstReadingText}\n\n[Translated to ${input.language}]`,
    responsorialPsalmText: isEnglish ? input.psalmText : `${input.psalmText}\n\n[Translated to ${input.language}]`,
    gospelText: isEnglish ? input.gospelText : `${input.gospelText}\n\n[Translated to ${input.language}]`,
    homily: isEnglish 
      ? "Today's readings invite us to contemplate the profound mystery of God's love manifested in our daily lives. The first reading reminds us that we are called to be instruments of divine grace, while the Gospel challenges us to live authentically as disciples of Christ. In our modern world, filled with distractions and competing voices, we must return to the fundamental truth that our identity is rooted in our relationship with the Divine. This relationship is not merely intellectual but deeply mystical, calling us to a transformation that touches every aspect of our being. As we reflect on these sacred texts, we are invited to move beyond surface understanding to a deeper contemplation of the divine mysteries that surround us each day."
      : `Las lecturas de hoy nos invitan a contemplar el profundo misterio del amor de Dios manifestado en nuestras vidas diarias. La primera lectura nos recuerda que estamos llamados a ser instrumentos de la gracia divina, mientras que el Evangelio nos desafía a vivir auténticamente como discípulos de Cristo. En nuestro mundo moderno, lleno de distracciones y voces competidoras, debemos volver a la verdad fundamental de que nuestra identidad está arraigada en nuestra relación con lo Divino. (${input.language})`
  };
}

export async function getDailyReading(input: DailyReadingInput): Promise<DailyReadingOutput> {
  // 1. Fetch the exact readings from Universalis
  const universalisData = await fetchReadingsFromUniversalis();

  // 2. Prepare the input for the AI
  const promptInput = {
    language: input.language,
    feastDay: stripHtml(universalisData.day),
    firstReadingText: formatReadingText(universalisData.Mass_R1.text),
    psalmText: formatReadingText(universalisData.Mass_Ps.text),
    gospelText: formatReadingText(universalisData.Mass_G.text),
  };
  
  // 3. Call the AI to translate and generate content
  const aiContent = await generateContentWithAI(promptInput);
  
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