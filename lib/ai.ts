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

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";

const COMPLEX_TERM_MAP: Array<[RegExp, string]> = [
  [/\banalyze\b/gi, "study"],
  [/\banalysis\b/gi, "study"],
  [/\bapproximately\b/gi, "about"],
  [/\bconsequently\b/gi, "so"],
  [/\bconstruct\b/gi, "build"],
  [/\bconsume\b/gi, "use"],
  [/\bdemonstrate\b/gi, "show"],
  [/\benvironment\b/gi, "surroundings"],
  [/\bfunction\b/gi, "job"],
  [/\billustrate\b/gi, "show"],
  [/\bindividuals\b/gi, "people"],
  [/\bindividual\b/gi, "person"],
  [/\binitial\b/gi, "first"],
  [/\bmethod\b/gi, "way"],
  [/\bmultiple\b/gi, "many"],
  [/\bnumerous\b/gi, "many"],
  [/\bobtain\b/gi, "get"],
  [/\bprocess\b/gi, "set of steps"],
  [/\bproduce\b/gi, "make"],
  [/\brequire\b/gi, "need"],
  [/\bsignificant\b/gi, "important"],
  [/\btherefore\b/gi, "so"],
  [/\btransmit\b/gi, "send"],
  [/\butilize\b/gi, "use"],
];

const EXTRA_SIMPLE_MAP: Array<[RegExp, string]> = [
  [/\bcomplex\b/gi, "hard"],
  [/\bconcept\b/gi, "idea"],
  [/\bdetermine\b/gi, "find out"],
  [/\binteract\b/gi, "work together"],
  [/\binvestigate\b/gi, "look into"],
  [/\bmechanism\b/gi, "how it works"],
  [/\bstructure\b/gi, "shape"],
];

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "because",
  "been",
  "being",
  "between",
  "could",
  "does",
  "each",
  "from",
  "have",
  "into",
  "lesson",
  "many",
  "more",
  "most",
  "other",
  "same",
  "should",
  "some",
  "than",
  "that",
  "their",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "using",
  "very",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
]);

const TRANSLATION_MAPS: Record<
  Exclude<LanguageCode, "en">,
  Record<string, string>
> = {
  hi: {
    and: "और",
    because: "क्योंकि",
    cells: "कोशिकाएं",
    cell: "कोशिका",
    change: "बदलाव",
    energy: "ऊर्जा",
    food: "भोजन",
    helps: "मदद करता है",
    important: "महत्वपूर्ण",
    idea: "विचार",
    light: "प्रकाश",
    make: "बनाना",
    many: "कई",
    need: "ज़रूरत",
    people: "लोग",
    plants: "पौधे",
    simple: "सरल",
    small: "छोटा",
    steps: "कदम",
    use: "उपयोग",
    water: "पानी",
  },
  kn: {
    and: "ಮತ್ತು",
    because: "ಏಕೆಂದರೆ",
    cells: "ಕೋಶಗಳು",
    cell: "ಕೋಶ",
    change: "ಬದಲಾವಣೆ",
    energy: "ಶಕ್ತಿ",
    food: "ಆಹಾರ",
    helps: "ಸಹಾಯ ಮಾಡುತ್ತದೆ",
    important: "ಮುಖ್ಯ",
    idea: "ಆಲೋಚನೆ",
    light: "ಬೆಳಕು",
    make: "ಮಾಡು",
    many: "ಅನೇಕ",
    need: "ಬೇಕು",
    people: "ಜನರು",
    plants: "ಸಸ್ಯಗಳು",
    simple: "ಸರಳ",
    small: "ಚಿಕ್ಕ",
    steps: "ಹಂತಗಳು",
    use: "ಬಳಸು",
    water: "ನೀರು",
  },
};

const GENERIC_DISTRACTORS = [
  "The text is mostly about an unrelated event.",
  "The lesson says nothing changes or matters.",
  "The passage focuses only on memorizing names.",
  "The topic is presented as pure opinion with no explanation.",
  "The text says the idea has no real purpose.",
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

  return buildOpenAIResponse({ text, language, simplerPass });
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
  const normalized = normalizeResponse({
    ...parsed,
    language,
    usedMock: false,
  });

  return normalized;
}

function buildMockResponse({
  text,
  language,
  simplerPass,
}: ProcessRequest): ProcessResponse {
  const simplifiedText = simplifyText(text, simplerPass);
  const translatedText =
    language === "en"
      ? simplifiedText
      : simulateTranslation(simplifiedText, language);

  return {
    simplifiedText,
    translatedText,
    quiz: buildMockQuiz(text, simplifiedText),
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
          GENERIC_DISTRACTORS[
            (index + options.length) % GENERIC_DISTRACTORS.length
          ],
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

  return buildMockQuiz(fallbackText, fallbackText);
}

function simplifyText(text: string, simplerPass: number): string {
  const normalizedText = cleanSpacing(text);
  const baseSentences = splitIntoSentences(normalizedText);
  const maxWords = Math.max(8, 18 - simplerPass * 3);

  const transformed = baseSentences
    .slice(0, 5)
    .map((sentence) => simplifySentence(sentence, simplerPass, maxWords))
    .filter(Boolean);

  if (transformed.length === 0) {
    return "Add a longer lesson and LearnAble will rewrite it in simpler words.";
  }

  return transformed.join("\n\n");
}

function simplifySentence(
  sentence: string,
  simplerPass: number,
  maxWords: number,
): string {
  let simplified = sentence;

  for (const [pattern, replacement] of COMPLEX_TERM_MAP) {
    simplified = simplified.replace(pattern, replacement);
  }

  if (simplerPass > 0) {
    for (const [pattern, replacement] of EXTRA_SIMPLE_MAP) {
      simplified = simplified.replace(pattern, replacement);
    }
  }

  simplified = cleanSpacing(simplified);
  const words = simplified.split(" ");
  const trimmedWords = words.slice(0, maxWords);
  let trimmedSentence = trimmedWords.join(" ");

  if (words.length > maxWords) {
    trimmedSentence += " ...";
  }

  trimmedSentence = trimmedSentence.replace(/\s+\.\.\.$/, "...");
  trimmedSentence = trimmedSentence.replace(/\s+([,.!?;:])/g, "$1");

  if (!/[.!?]$/.test(trimmedSentence)) {
    trimmedSentence += ".";
  }

  return trimmedSentence.charAt(0).toUpperCase() + trimmedSentence.slice(1);
}

function simulateTranslation(
  simplifiedText: string,
  language: Exclude<LanguageCode, "en">,
): string {
  const translated = simplifiedText.replace(/\b([a-zA-Z']+)\b/g, (word) => {
    const replacement = TRANSLATION_MAPS[language][word.toLowerCase()];
    return replacement || word;
  });

  const intro = language === "hi" ? "सरल अनुवाद:\n" : "ಸರಳ ಅನುವಾದ:\n";

  return `${intro}${translated}`;
}

function buildMockQuiz(originalText: string, simplifiedText: string): QuizQuestion[] {
  const sourceSegments = buildQuizSegments(originalText, simplifiedText);
  const questionCount = Math.min(5, Math.max(3, sourceSegments.length));
  const selectedSegments = sourceSegments.slice(0, questionCount);

  return selectedSegments.map((segment, index) => {
    const questionLabel =
      segment.keyword !== "this topic"
        ? `What does the lesson say about ${segment.keyword}?`
        : `What is one key idea from part ${index + 1}?`;

    const distractors = sourceSegments
      .filter((_, candidateIndex) => candidateIndex !== index)
      .map((candidate) => candidate.summary)
      .concat(GENERIC_DISTRACTORS)
      .filter((option, optionIndex, allOptions) => {
        return (
          option !== segment.summary && allOptions.indexOf(option) === optionIndex
        );
      })
      .slice(0, 3);

    const rawOptions = [segment.summary, ...distractors];
    while (rawOptions.length < 4) {
      rawOptions.push(
        GENERIC_DISTRACTORS[
          (index + rawOptions.length) % GENERIC_DISTRACTORS.length
        ],
      );
    }

    const rotation = index % 4;
    const options = rotateArray(rawOptions.slice(0, 4), rotation);
    const correctIndex = options.indexOf(segment.summary);

    return {
      id: `question-${index + 1}`,
      question: questionLabel,
      options,
      correctIndex,
    };
  });
}

function buildQuizSegments(originalText: string, simplifiedText: string) {
  const candidateSentences = splitIntoSentences(originalText)
    .concat(splitIntoSentences(simplifiedText))
    .filter((sentence) => sentence.split(/\s+/).length >= 6);

  if (candidateSentences.length === 0) {
    candidateSentences.push(simplifiedText || originalText);
  }

  const uniqueSentences = candidateSentences.filter(
    (sentence, index) => candidateSentences.indexOf(sentence) === index,
  );

  return uniqueSentences.slice(0, 5).map((sentence) => ({
    summary: summarizeForQuiz(sentence),
    keyword: extractKeyword(sentence),
  }));
}

function summarizeForQuiz(sentence: string): string {
  const simplified = simplifySentence(sentence, 1, 12);
  return cleanSpacing(simplified.replace(/\.\.\./g, "").replace(/[.!?]$/, ""));
}

function extractKeyword(sentence: string): string {
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word));

  return words[0] || "this topic";
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanSpacing(sentence))
    .filter((sentence) => sentence.length > 0);
}

function cleanSpacing(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
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
