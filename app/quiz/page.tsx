"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  QUESTIONS,
  BONUS_QUESTIONS,
  selectBonusQuestions,
  scoreResponses,
  type QuizResponses,
  type Question,
} from "@/src/lib/quiz";

// Quiz flow states
type QuizState = "code" | "welcome" | "quiz" | "submitting";

// Access code from environment variable
const QUIZ_CODE = process.env.NEXT_PUBLIC_QUIZ_CODE;

export default function QuizPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>("code");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponses>({});
  const [selectedResponse, setSelectedResponse] = useState<
    number | number[] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>(QUESTIONS);
  const [bonusQuestionIds, setBonusQuestionIds] = useState<number[]>([]);
  const [showBonusQuestions, setShowBonusQuestions] = useState(false);

  // Check for stored access code on mount
  useEffect(() => {
    // Only require code if QUIZ_CODE is set
    if (!QUIZ_CODE) {
      setState("welcome");
      return;
    }

    // Check sessionStorage for valid code
    const storedCode = sessionStorage.getItem("quizAccessCode");
    if (storedCode === QUIZ_CODE) {
      setState("welcome");
    }
  }, []);

  // Handle code submission
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");

    if (!code.trim()) {
      setCodeError("Please enter an access code");
      return;
    }

    // Validate code
    if (code.trim() === QUIZ_CODE) {
      // Store in sessionStorage for this session
      sessionStorage.setItem("quizAccessCode", code.trim());
      setState("welcome");
    } else {
      setCodeError("Invalid access code. Please try again.");
      setCode("");
    }
  };

  // Get current question from allQuestions (core + bonus)
  const currentQuestion = allQuestions[currentQuestionIndex];
  // Check if current question is a bonus question (ID >= 100)
  const isBonusQuestion = currentQuestion && currentQuestion.id >= 100;
  // Calculate total questions (core + bonus if they've been added)
  const totalQuestions = allQuestions.length;
  // Calculate which bonus question number this is (if bonus)
  const bonusQuestionNumber = isBonusQuestion
    ? currentQuestionIndex - QUESTIONS.length + 1
    : 0;
  const totalBonusQuestions = bonusQuestionIds.length;
  
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  // Handle welcome form submission
  const handleStartQuiz = () => {
    setState("quiz");
  };

  // Handle answer selection based on question type
  const handleAnswerSelect = (value: number | number[]) => {
    setSelectedResponse(value);
  };

  // Handle next question or submit
  const handleNext = async () => {
    // Validate that an answer is selected
    if (selectedResponse === null) {
      return; // Don't proceed without an answer
    }

    // Save the response
    const newResponses = {
      ...responses,
      [currentQuestion.id]: selectedResponse,
    };
    setResponses(newResponses);

    // Check if we just finished the core questions (10 questions)
    if (currentQuestionIndex === QUESTIONS.length - 1 && !showBonusQuestions) {
      // Calculate preliminary scores to determine if we need bonus questions
      const preliminaryScores = scoreResponses(newResponses);
      const topScore = preliminaryScores.ranked[0].score;
      const secondScore = preliminaryScores.ranked[1]?.score || 0;
      const scoreDifference = topScore - secondScore;

      // Select bonus questions: use tie-breaker if within 2 points, otherwise random
      const selectedBonusIds = selectBonusQuestions(
        preliminaryScores.totals,
        name || undefined, // Use name as seed for deterministic selection
      );
      setBonusQuestionIds(selectedBonusIds);

      // Always show 2 bonus questions (per requirements: "Randomly select 2 bonus questions per user OR ask when within 2 points")
      // Since we're selecting based on tie-breaker logic, we'll show them
      if (selectedBonusIds.length > 0) {
        // Append bonus questions to core questions
        const bonusQuestionsToShow = BONUS_QUESTIONS.filter((q) =>
          selectedBonusIds.includes(q.id),
        );
        setAllQuestions([...QUESTIONS, ...bonusQuestionsToShow]);
        setShowBonusQuestions(true);
        setCurrentQuestionIndex(QUESTIONS.length); // Start at first bonus question
        setSelectedResponse(null);
        return;
      }
    }

    // Check if this is the last question overall
    if (currentQuestionIndex < allQuestions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedResponse(null);
    } else {
      // Submit the quiz
      await handleSubmit(newResponses);
    }
  };

  // Handle quiz submission
  const handleSubmit = async (finalResponses: QuizResponses) => {
    setIsSubmitting(true);
    setState("submitting");

    try {
      // Get access code from sessionStorage
      const accessCode = sessionStorage.getItem("quizAccessCode") || "";

      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: finalResponses,
          name: name.trim() || null,
          team: team.trim() || null,
          accessCode: accessCode,
          bonusQuestionsShown: bonusQuestionIds, // Store which bonus questions were shown
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          // Access code issue - clear stored code and redirect to code entry
          sessionStorage.removeItem("quizAccessCode");
          alert("Access code expired or invalid. Please enter the code again.");
          setState("code");
          setIsSubmitting(false);
          return;
        }
        throw new Error(errorData.error || "Failed to submit quiz");
      }

      const data = await response.json();

      // Store in localStorage for admin page (temporary solution)
      const existingResults = JSON.parse(
        localStorage.getItem("quizResults") || "[]",
      );
      existingResults.push(data.submission);
      localStorage.setItem("quizResults", JSON.stringify(existingResults));

      // Redirect to results page
      router.push(`/result/${data.submissionId}`);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("There was an error submitting your assessment. Please try again.");
      setIsSubmitting(false);
      setState("quiz");
    }
  };

  // Render code entry screen
  if (state === "code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Access Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Please enter the access code to continue.
            </p>

            <form onSubmit={handleCodeSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="access-code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Access Code
                </label>
                <input
                  type="text"
                  id="access-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError("");
                  }}
                  placeholder="Enter access code"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 ${
                    codeError
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  autoFocus
                />
                {codeError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {codeError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Continue
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render welcome screen
  if (state === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Role Alignment Assessment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2 text-center">
              Understanding how you naturally approach problems, risk, and
              delivery
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
              Take a few moments to reflect on your preferences and interests.
              This assessment will help identify which role aligns best with
              your natural thinking patterns.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label
                  htmlFor="team"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Team <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="team"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Your team"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg shadow-lg hover:shadow-xl"
            >
              Begin Reflection
            </button>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render submitting state
  if (state === "submitting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Processing your responses...
          </p>
        </div>
      </div>
    );
  }

  // Render question based on type
  const renderQuestion = (question: Question) => {
    if (question.type === "forced_choice") {
      // Forced choice: show all options as buttons (typically 2-4 options)
      // If exactly 2 options, label them A/B
      const isTwoOptions = question.options.length === 2;

      return (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedResponse === index;
            const label = isTwoOptions ? (index === 0 ? "A" : "B") : null;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {label && (
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm">
                      {label}
                    </span>
                  )}
                  <span className="text-gray-900 dark:text-white text-base md:text-lg flex-1">
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === "multiple_choice") {
      // Multiple choice: show options as checkable buttons
      const selectedIndices = Array.isArray(selectedResponse)
        ? selectedResponse
        : [];

      return (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedIndices.includes(index);

            return (
              <button
                key={index}
                onClick={() => {
                  if (isSelected) {
                    // Deselect
                    const newSelection = selectedIndices.filter(
                      (i) => i !== index,
                    );
                    handleAnswerSelect(
                      newSelection.length > 0 ? newSelection : [],
                    );
                  } else {
                    // Select (but limit to 2)
                    if (selectedIndices.length < 2) {
                      const newSelection = [...selectedIndices, index];
                      handleAnswerSelect(newSelection);
                    }
                  }
                }}
                disabled={!isSelected && selectedIndices.length >= 2}
                className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md"
                    : !isSelected && selectedIndices.length >= 2
                      ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white text-base md:text-lg flex-1">
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === "likert") {
      // Likert scale: 5 options in a horizontal row (mobile: stack, desktop: row)
      const selectedIndex =
        typeof selectedResponse === "number" ? selectedResponse : null;
      const labels = [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
      ];

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {question.options.map((option, index) => {
              const isSelected = selectedIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`text-2xl md:text-3xl font-bold ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden md:block text-center leading-tight">
                      {labels[index]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 md:hidden px-2">
            <span>Disagree</span>
            <span>Agree</span>
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {selectedIndex !== null && (
              <span className="font-medium">
                Selected: {question.options[selectedIndex]}
              </span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Validate if answer is selected
  const canProceed = (() => {
    if (selectedResponse === null) return false;
    if (currentQuestion.type === "multiple_choice") {
      return Array.isArray(selectedResponse) && selectedResponse.length > 0;
    }
    return true;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">
              {isBonusQuestion ? (
                <>
                  Bonus Question {bonusQuestionNumber} of {totalBonusQuestions}
                  <span className="text-gray-500 dark:text-gray-500 ml-2">
                    (Question {currentQuestionIndex + 1} of {totalQuestions})
                  </span>
                </>
              ) : (
                <>Question {currentQuestionIndex + 1} of {totalQuestions}</>
              )}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-3">
            <div
              className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                isBonusQuestion
                  ? "bg-purple-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 lg:p-10">
          {isBonusQuestion && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                Bonus Question
              </span>
            </div>
          )}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 leading-tight">
            {currentQuestion.prompt}
          </h2>
          {currentQuestion.type === "multiple_choice" && (
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8 italic">
              Select up to 2 options
            </p>
          )}
          {currentQuestion.type !== "multiple_choice" && (
            <div className="mb-6 md:mb-8"></div>
          )}

          {/* Answer options */}
          <div className="mb-8 md:mb-10">{renderQuestion(currentQuestion)}</div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => {
                  const prevIndex = currentQuestionIndex - 1;
                  setCurrentQuestionIndex(prevIndex);
                  const prevQuestion = allQuestions[prevIndex];
                  setSelectedResponse(responses[prevQuestion.id] || null);
                }}
                className="flex-1 md:flex-none px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                ← Previous
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex-1 md:flex-none px-8 py-3 font-semibold rounded-lg transition-colors duration-200 ${
                canProceed
                  ? isBonusQuestion
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {currentQuestionIndex < totalQuestions - 1
                ? "Continue →"
                : "Complete Reflection"}
            </button>
          </div>
        </div>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
