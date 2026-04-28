# LearnAble

LearnAble is a full-stack AI-powered learning web app built with Next.js and TypeScript. It turns dense educational text into simpler explanations, translated study content, text-to-speech playback, and a quick multiple-choice quiz.

## Features

- Simplifies educational text into a more accessible explanation
- Translates output to English, Hindi, or Kannada
- Generates a 3-5 question MCQ quiz
- Supports browser text-to-speech with Play and Stop controls
- Includes a low-data mode that keeps the experience text-first
- Falls back to deterministic mock AI responses when `OPENAI_API_KEY` is not set

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Next.js route handler API
- OpenAI Node SDK with mock fallback
- Web Speech API for audio playback

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment

To enable real OpenAI processing, create a `.env.local` file with:

```bash
OPENAI_API_KEY=your_api_key_here
```

Optionally override the model:

```bash
OPENAI_MODEL=gpt-5.2
```

Without an API key, the app still works end-to-end using mock simplification, translation, and quiz generation.
