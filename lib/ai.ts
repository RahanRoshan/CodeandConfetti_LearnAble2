import OpenAI from "openai";

export type LanguageCode = "en" | "hi" | "kn";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type ProcessRequest = {
  text: string;
  language: LanguageCode;
  simplerPass: number;
};

export type ProcessResponse = {
  simplifiedText: string;
  translatedText: string;
  quiz: QuizQuestion[];
  language: LanguageCode;
  usedMock: boolean;
};

type KnownConcept = {
  term: string;
  explanation: string;
  importance: string;
};

type LessonAnalysis = {
  mainIdea: string;
  processSteps: string[];
  importance: string;
  detailFacts: string[];
  concept?: KnownConcept;
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";

const KNOWN_CONCEPTS: KnownConcept[] = [
  {
    term: "photosynthesis",
    explanation:
      "Photosynthesis is how plants use sunlight, water, and air to make their own food.",
    importance:
      "It matters because it helps plants grow and adds oxygen to the air.",
  },
  {
    term: "water cycle",
    explanation:
      "The water cycle is how water moves from the ground to the sky and back again.",
    importance:
      "It matters because it keeps water moving through nature so living things can use it.",
  },
  {
    term: "evaporation",
    explanation:
      "Evaporation is when liquid water heats up and turns into vapor.",
    importance:
      "It matters because it helps move water from the ground into the air.",
  },
  {
    term: "condensation",
    explanation:
      "Condensation is when vapor cools down and turns into tiny drops of water.",
    importance:
      "It matters because it helps clouds form.",
  },
  {
    term: "precipitation",
    explanation:
      "Precipitation is water that falls from clouds as rain, snow, sleet, or hail.",
    importance:
      "It matters because it brings water back to the ground.",
  },
  {
    term: "respiration",
    explanation:
      "Respiration is how living things release energy from food.",
    importance:
      "It matters because cells need energy to stay alive and do their jobs.",
  },
  {
    term: "cell division",
    explanation:
      "Cell division is when one cell splits to make new cells.",
    importance:
      "It matters because living things grow, heal, and replace old cells this way.",
  },
  {
    term: "gravity",
    explanation:
      "Gravity is the force that pulls objects toward each other.",
    importance:
      "It matters because it keeps people, water, and planets in place.",
  },
  {
    term: "ecosystem",
    explanation:
      "An ecosystem is a community of living things and the place where they live.",
    importance:
      "It matters because plants, animals, water, air, and soil all affect one another there.",
  },
  {
    term: "food chain",
    explanation:
      "A food chain shows who eats whom so energy can move through living things.",
    importance:
      "It matters because it explains how living things depend on one another for energy.",
  },
];

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bcontinuous movement\b/gi, "ongoing movement"],
  [/\bconvert(?:s|ed|ing)?\b/gi, "change"],
  [/\bchemical energy\b/gi, "stored energy"],
  [/\bcarbon dioxide\b/gi, "a gas in the air called carbon dioxide"],
  [/\bprecipitation\b/gi, "rain or snow"],
  [/\bcollection\b/gi, "gathering"],
  [/\bcondensation\b/gi, "cooling into drops"],
  [/\bevaporation\b/gi, "turning into vapor"],
  [/\bvapor\b/gi, "water vapor"],
  [/\bchlorophyll\b/gi, "the green part of a plant"],
  [/\bbiological\b/gi, "living"],
  [/\borganisms?\b/gi, "living things"],
  [/\butilize\b/gi, "use"],
  [/\bobtain\b/gi, "get"],
  [/\breleases?\b/gi, "gives off"],
  [/\bessential\b/gi, "important"],
  [/\bapproximately\b/gi, "about"],
  [/\btherefore\b/gi, "so"],
  [/\bconsequently\b/gi, "so"],
];

const DETAIL_MARKERS = /\b(first|next|then|finally|because|so|helps|important|essential|used to|turns|forms|makes|moves)\b/i;
const IMPORTANCE_MARKERS = /\b(because|important|essential|helps|allow|allows|needed|need|so that|therefore|keeps)\b/i;

const MAIN_IDEA_DISTRACTORS = [
  "It says the topic is completely unrelated to the lesson.",
  "It says nothing changes during the process.",
  "It claims the passage is only about memorizing names.",
];

const DEFINITION_DISTRACTORS = [
  "It is a tool that stops the process from happening.",
  "It is a part of the lesson that does nothing useful.",
  "It is a solid object that never changes.",
];

const IMPORTANCE_DISTRACTORS = [
  "Because it has no real effect on anything else.",
  "Because it only happens by accident and means nothing.",
  "Because it stops all other parts of the system from working.",
];

const DETAIL_DISTRACTORS = [
  "The passage says the process ends before anything changes.",
  "The passage says the topic works without any steps at all.",
  "The passage says the result happens before the cause.",
];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en" || value === "hi" || value === "kn";
}

export async function processLearningContent({
  text,
  language,
  simplerPass,
}: ProcessRequest): Promise<ProcessResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return buildMockResponse({ text, language, simplerPass });
  }

  try {
    return await buildOpenAIResponse({ text, language, simplerPass });
  } catch (error) {
    console.error("OpenAI processing failed, falling back to mock mode.", error);
    return buildMockResponse({ text, language, simplerPass });
  }
}

async function buildOpenAIResponse({
  text,
  language,
  simplerPass,
}: ProcessRequest): Promise<ProcessResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const languageName = languageToName(language);
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions:
      'You turn educational text into accessible study material. Return only valid JSON with no markdown fences, no commentary, and no extra keys. The JSON shape must be {"simplifiedText": string, "translatedText": string, "quiz": [{"id": string, "question": string, "options": string[4], "correctIndex": number}]}. Keep 3 to 5 quiz questions. Each correctIndex must be between 0 and 3.',
    input: `Simplify the educational text so a 12-year-old can understand it. Simpler pass number: ${simplerPass}. The higher the pass number, the shorter and simpler the explanation should become. Translate the simplified explanation into ${languageName}. If the target language is English, translatedText should be natural English. Create 3 to 5 multiple-choice quiz questions based on the lesson.

Educational text:
${text}`,
  });

  const parsed = parseModelPayload(response.output_text);
  return normalizeResponse({
    ...parsed,
    language,
    usedMock: false,
  });
}

async function buildMockResponse({
  text,
  language,
  simplerPass,
}: ProcessRequest): Promise<ProcessResponse> {
  const analysis = analyzeLesson(text, simplerPass);
  const simplifiedText = formatSimplifiedText(analysis, simplerPass);
  const translatedText =
    language === "en"
      ? simplifiedText
      : await translateText(simplifiedText, language);

  return {
    simplifiedText,
    translatedText,
    quiz: buildMockQuiz(analysis),
    language,
    usedMock: true,
  };
}

function parseModelPayload(
  outputText: string,
): Omit<ProcessResponse, "language" | "usedMock"> {
  const firstBrace = outputText.indexOf("{");
  const lastBrace = outputText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("OpenAI returned an unexpected format.");
  }

  const parsed = JSON.parse(outputText.slice(firstBrace, lastBrace + 1)) as {
    simplifiedText?: unknown;
    translatedText?: unknown;
    quiz?: unknown;
  };

  return {
    simplifiedText:
      typeof parsed.simplifiedText === "string" ? parsed.simplifiedText : "",
    translatedText:
      typeof parsed.translatedText === "string" ? parsed.translatedText : "",
    quiz: Array.isArray(parsed.quiz) ? (parsed.quiz as QuizQuestion[]) : [],
  };
}

function normalizeResponse(response: ProcessResponse): ProcessResponse {
  const simplifiedText =
    cleanSpacing(response.simplifiedText) || "No simplified text was returned.";
  const translatedText = cleanSpacing(response.translatedText) || simplifiedText;
  const quiz = sanitizeQuiz(response.quiz, simplifiedText);

  return {
    simplifiedText,
    translatedText,
    quiz,
    language: response.language,
    usedMock: response.usedMock,
  };
}

function sanitizeQuiz(
  questions: QuizQuestion[],
  fallbackText: string,
): QuizQuestion[] {
  const cleanedQuestions = questions
    .filter((question) => question && typeof question.question === "string")
    .slice(0, 5)
    .map((question, index) => {
      const filteredOptions = Array.isArray(question.options)
        ? question.options
            .filter((option): option is string => typeof option === "string")
            .slice(0, 4)
        : [];

      const options = [...filteredOptions];
      while (options.length < 4) {
        options.push(
          DETAIL_DISTRACTORS[(index + options.length) % DETAIL_DISTRACTORS.length],
        );
      }

      return {
        id: question.id || `question-${index + 1}`,
        question:
          cleanSpacing(question.question) ||
          `What is a key idea from part ${index + 1}?`,
        options: options.map(
          (option) => cleanSpacing(option) || "Review the lesson again.",
        ),
        correctIndex:
          typeof question.correctIndex === "number" &&
          question.correctIndex >= 0 &&
          question.correctIndex < 4
            ? question.correctIndex
            : 0,
      };
    });

  if (cleanedQuestions.length >= 3) {
    return cleanedQuestions;
  }

  return buildMockQuiz(analyzeLesson(fallbackText, 0));
}

function analyzeLesson(text: string, simplerPass: number): LessonAnalysis {
  const normalizedText = cleanSpacing(text);
  const sentences = splitIntoSentences(normalizedText).slice(0, 6);
  const concept = detectConcept(normalizedText);
  const simplifiedSentences = sentences
    .map((sentence, index) =>
      simplifySentence(sentence, simplerPass, index === 0 ? 24 : 18),
    )
    .filter(Boolean);

  const detailFacts = simplifiedSentences.filter((sentence) =>
    DETAIL_MARKERS.test(sentence),
  );
  const processSteps = uniqueStrings(
    simplifiedSentences
      .slice(concept ? 1 : 0)
      .filter(
        (sentence) =>
          sentence !== concept?.explanation && !IMPORTANCE_MARKERS.test(sentence),
      )
      .flatMap((sentence) => expandIntoStepCandidates(sentence)),
  ).slice(0, simplerPass > 0 ? 2 : 3);

  const mainIdea =
    concept?.explanation ||
    simplifySentence(sentences[0] || normalizedText, simplerPass, 24);

  const importanceSentence =
    simplifiedSentences.find((sentence) => IMPORTANCE_MARKERS.test(sentence)) ||
    sentences.find((sentence) => IMPORTANCE_MARKERS.test(sentence));

  const importance =
    concept?.importance ||
    simplifyImportance(
      importanceSentence || simplifiedSentences.at(-1) || mainIdea,
      simplerPass,
    );

  return {
    mainIdea,
    processSteps: processSteps.length > 0 ? processSteps : simplifiedSentences.slice(0, 2),
    importance,
    detailFacts: uniqueStrings([
      ...processSteps,
      ...detailFacts.filter((sentence) => !IMPORTANCE_MARKERS.test(sentence)),
      ...simplifiedSentences.filter((sentence) => !IMPORTANCE_MARKERS.test(sentence)),
    ]).slice(0, 3),
    concept,
  };
}

function formatSimplifiedText(
  analysis: LessonAnalysis,
  simplerPass: number,
): string {
  const sections = [`Main idea: ${analysis.mainIdea}`];

    if (analysis.processSteps.length > 0) {
      sections.push(
        `How it works: ${analysis.processSteps
          .slice(0, simplerPass > 0 ? 2 : 3)
          .join(" ")}`,
      );
    }

  sections.push(`Why it matters: ${analysis.importance}`);

  return sections.join("\n\n");
}

function simplifySentence(
  sentence: string,
  simplerPass: number,
  maxWords: number,
): string {
  const definitionMatch = sentence.match(
    /^(.+?) is (?:an?|the)?\s*(.+?)\s+(which|where|when|by which)\s+(.+)$/i,
  );

  if (definitionMatch) {
    const subject = simplifyFragment(definitionMatch[1], maxWords);
    const definition = simplifyFragment(definitionMatch[2], maxWords);
    const tail = simplifyFragment(definitionMatch[4], maxWords);

    const combined = `${capitalize(subject)} is ${definition}. It ${lowercaseFirst(
      tail,
    )}`;
    return shortenSentence(combined, simplerPass, maxWords + 4);
  }

  return shortenSentence(sentence, simplerPass, maxWords);
}

function simplifyImportance(sentence: string, simplerPass: number): string {
  const simplified = simplifySentence(sentence, simplerPass, 20);

  if (/^why it matters:/i.test(simplified)) {
    return simplified;
  }

  if (simplified.toLowerCase().startsWith("because ")) {
    return `It matters ${lowercaseFirst(simplified)}`;
  }

  return simplified;
}

function shortenSentence(
  sentence: string,
  simplerPass: number,
  maxWords: number,
): string {
  const cleaned = simplifyFragment(sentence, maxWords + 8);
  const clauses = cleaned
    .split(/,\s+|;\s+/)
    .map((part) => cleanSpacing(part))
    .filter(Boolean);

  const keptClauses = clauses.slice(0, simplerPass > 0 ? 1 : 2);
  const joined = keptClauses.join(", ");

  return trimToWordCount(joined, Math.max(10, maxWords - simplerPass * 4));
}

function simplifyFragment(text: string, maxWords: number): string {
  let simplified = text
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bfor example\b/gi, " ")
    .replace(/\bsuch as\b/gi, "like")
    .replace(/^During this process,?\s*/i, "")
    .replace(/^In this process,?\s*/i, "")
    .replace(/^During this reaction,?\s*/i, "");

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    simplified = simplified.replace(pattern, replacement);
  }

  simplified = simplified
    .replace(/\bprior to\b/gi, "before")
    .replace(/\bsubsequent to\b/gi, "after")
    .replace(/\btherefore\b/gi, "so")
    .replace(/\bconsequently\b/gi, "so")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bobtain\b/gi, "get")
    .replace(/\brequire\b/gi, "need")
    .replace(/\bdemonstrate\b/gi, "show")
    .replace(/\bapproximately\b/gi, "about");

  return trimToWordCount(simplified, maxWords);
}

function expandIntoStepCandidates(sentence: string): string[] {
  const base = sentence
    .replace(/^During this process,?\s*/i, "")
    .replace(/^In this process,?\s*/i, "")
    .replace(/^During this reaction,?\s*/i, "");

  const parts = base
    .split(/,\s+and\s+|\.\s+Then\s+|\s+and then\s+/i)
    .map((part) => ensureSentencePunctuation(cleanSpacing(part)))
    .filter((part) => part.split(/\s+/).length >= 6);

  return parts.length > 0 ? parts : [ensureSentencePunctuation(base)];
}

async function translateText(
  text: string,
  language: Exclude<LanguageCode, "en">,
): Promise<string> {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  try {
    const translatedParagraphs = await Promise.all(
      paragraphs.map(async (paragraph) => {
        const endpoint = new URL(
          "https://translate.googleapis.com/translate_a/single",
        );
        endpoint.searchParams.set("client", "gtx");
        endpoint.searchParams.set("sl", "en");
        endpoint.searchParams.set("tl", language);
        endpoint.searchParams.set("dt", "t");
        endpoint.searchParams.set("q", paragraph);

        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Translation request failed with ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
          throw new Error("Unexpected translation response format");
        }

        return (payload[0] as unknown[])
          .map((segment) =>
            Array.isArray(segment) && typeof segment[0] === "string"
              ? segment[0]
              : "",
          )
          .join("");
      }),
    );

    return translatedParagraphs.join("\n\n");
  } catch (error) {
    console.error("Translation fallback failed, returning simplified text.", error);
    return text;
  }
}

function buildMockQuiz(analysis: LessonAnalysis): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let questionIndex = 1;

  questions.push(
    buildQuestion({
      id: `question-${questionIndex++}`,
      question: "What is the main idea of this passage?",
      correct: analysis.mainIdea,
      distractors: MAIN_IDEA_DISTRACTORS,
      rotation: 0,
    }),
  );

  if (analysis.concept) {
    questions.push(
      buildQuestion({
        id: `question-${questionIndex++}`,
        question: `In simple words, what is ${analysis.concept.term}?`,
        correct: analysis.concept.explanation,
        distractors: DEFINITION_DISTRACTORS,
        rotation: 1,
      }),
    );
  }

  if (analysis.processSteps.length > 1) {
    questions.push(
      buildQuestion({
        id: `question-${questionIndex++}`,
        question: "Which step happens first in the explanation?",
        correct: analysis.processSteps[0],
        distractors: uniqueStrings([
          analysis.processSteps[1],
          analysis.processSteps[2] || DETAIL_DISTRACTORS[0],
          DETAIL_DISTRACTORS[1],
        ]),
        rotation: 2,
      }),
    );

    questions.push(
      buildQuestion({
        id: `question-${questionIndex++}`,
        question: `What happens after ${trimForPrompt(analysis.processSteps[0], 8)}?`,
        correct: analysis.processSteps[1],
        distractors: uniqueStrings([
          analysis.importance,
          analysis.processSteps[2] || DETAIL_DISTRACTORS[2],
          DETAIL_DISTRACTORS[0],
        ]),
        rotation: 3,
      }),
    );
  }

  questions.push(
    buildQuestion({
      id: `question-${questionIndex++}`,
      question: "Why does this topic or process matter?",
      correct: analysis.importance,
      distractors: IMPORTANCE_DISTRACTORS,
      rotation: 0,
    }),
  );

  if (questions.length < 5 && analysis.detailFacts.length > 0) {
    questions.push(
      buildQuestion({
        id: `question-${questionIndex++}`,
        question: "Which detail matches the passage?",
        correct: analysis.detailFacts[0],
        distractors: DETAIL_DISTRACTORS,
        rotation: 1,
      }),
    );
  }

  return questions.slice(0, 5);
}

function buildQuestion({
  id,
  question,
  correct,
  distractors,
  rotation,
}: {
  id: string;
  question: string;
  correct: string;
  distractors: string[];
  rotation: number;
}): QuizQuestion {
  const uniqueOptions = uniqueStrings([correct, ...distractors]).slice(0, 4);

  while (uniqueOptions.length < 4) {
    uniqueOptions.push(
      DETAIL_DISTRACTORS[(rotation + uniqueOptions.length) % DETAIL_DISTRACTORS.length],
    );
  }

  const rotatedOptions = rotateArray(uniqueOptions, rotation % 4);

  return {
    id,
    question,
    options: rotatedOptions.map((option) => stripTrailingPunctuation(option)),
    correctIndex: rotatedOptions.indexOf(correct),
  };
}

function detectConcept(text: string): KnownConcept | undefined {
  const normalized = text.toLowerCase();
  return KNOWN_CONCEPTS.find((concept) =>
    normalized.includes(concept.term.toLowerCase()),
  );
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanSpacing(sentence))
    .filter((sentence) => sentence.length > 0);
}

function trimToWordCount(text: string, maxWords: number): string {
  const words = cleanSpacing(text).split(" ").filter(Boolean);
  const trimmed = words.slice(0, maxWords).join(" ");

  if (words.length <= maxWords) {
    return ensureSentencePunctuation(trimmed);
  }

  return ensureSentencePunctuation(`${trimmed}...`);
}

function ensureSentencePunctuation(text: string): string {
  const cleaned = cleanSpacing(text).replace(/\s+\.\.\.$/, "...");
  if (!cleaned) {
    return cleaned;
  }

  if (/[.!?]$/.test(cleaned) || cleaned.endsWith("...")) {
    return cleaned;
  }

  return `${cleaned}.`;
}

function cleanSpacing(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
}

function uniqueStrings(items: string[]): string[] {
  return items.filter((item, index) => item && items.indexOf(item) === index);
}

function capitalize(text: string): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function lowercaseFirst(text: string): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toLowerCase() + text.slice(1);
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.!?]+$/, "");
}

function trimForPrompt(text: string, maxWords: number): string {
  return stripTrailingPunctuation(
    text.split(" ").slice(0, maxWords).join(" ").toLowerCase(),
  );
}

function languageToName(language: LanguageCode): string {
  switch (language) {
    case "hi":
      return "Hindi";
    case "kn":
      return "Kannada";
    default:
      return "English";
  }
}

function rotateArray<T>(items: T[], rotation: number): T[] {
  if (items.length === 0) {
    return items;
  }

  const safeRotation = rotation % items.length;
  return items.slice(safeRotation).concat(items.slice(0, safeRotation));
}
