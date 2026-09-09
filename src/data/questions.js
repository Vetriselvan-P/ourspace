// Curated relationship & fun daily questions
export const DAILY_QUESTIONS = [
  { id: 1, question: "What is a small, random memory of us that always makes you smile?" },
  { id: 2, question: "If we could teleport anywhere in the world right now for dinner, where would we go?" },
  { id: 3, question: "What song reminds you of me the most, and why?" },
  { id: 4, question: "What was the very first thought you had when you first saw me?" },
  { id: 5, question: "What is one little quirk about me that you secretly find adorable?" },
  { id: 6, question: "What is your absolute favorite comfort food day dream right now?" },
  { id: 7, question: "If we had a rainy day with no phones or chores, how would we spend it together?" },
  { id: 8, question: "What is something exciting you want us to accomplish together in the next year?" },
  { id: 9, question: "What makes you feel most loved and appreciated by me?" },
  { id: 10, question: "If we were in a comedy movie, what would our couple trope be?" },
  { id: 11, question: "What's the best compliment I ever gave you?" },
  { id: 12, question: "What was the best date we ever had so far?" },
  { id: 13, question: "If you could steal one item from my wardrobe to wear forever, what would it be?" },
  { id: 14, question: "What's a new hobby or activity you'd love for us to try together?" },
  { id: 15, question: "What is one thing that happened to you today that made you laugh or sigh?" },
  { id: 16, question: "If our relationship had a title track, what genre would it be?" },
  { id: 17, question: "What's your favorite photo of us, and why do you love it?" },
  { id: 18, question: "What is something I do that always calms you down when you're stressed?" },
  { id: 19, question: "What's a silly secret goal or wish you haven't told many people about?" },
  { id: 20, question: "What are three words that best describe our vibe together?" },
  { id: 21, question: "If we adopted a pet together tomorrow, what would we name it?" },
  { id: 22, question: "What is one habit of ours you hope we never lose?" }
];

/**
 * Returns today's question based on the calendar date (YYYY-MM-DD)
 */
export function getQuestionForDate(dateStr) {
  if (!dateStr) {
    const today = new Date();
    dateStr = today.toISOString().split('T')[0];
  }
  
  // Calculate deterministic index based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_QUESTIONS.length;
  return {
    ...DAILY_QUESTIONS[index],
    dateStr
  };
}

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
