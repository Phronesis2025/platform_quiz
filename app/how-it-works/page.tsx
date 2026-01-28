import Link from "next/link";
import { ROLES } from "@/src/lib/quiz";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Platform Quiz
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/quiz"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
              >
                Take Quiz
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            How Scores Are Calculated
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              This page explains how your quiz answers determine your role fit
              scores and which role you're assigned to.
            </p>

            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The quiz uses a scoring system where each answer you select
                contributes points to one or more of the four roles:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>
                  <strong>{ROLES.BE.label}</strong> (BE) - Backend Engineer
                </li>
                <li>
                  <strong>{ROLES.FE.label}</strong> (FE) - Frontend Engineer
                </li>
                <li>
                  <strong>{ROLES.QA.label}</strong> (QA) - Quality Assurance
                  Engineer
                </li>
                <li>
                  <strong>{ROLES.PM.label}</strong> (PM) - Product Manager
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Your final role assignment is based on which role accumulates
                the most points across all your answers.
              </p>
            </section>

            {/* Question Types */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Question Types and Scoring
              </h2>

              <div className="space-y-6">
                {/* Forced Choice */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Forced Choice Questions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    These questions ask you to pick <strong>one</strong> option
                    from a list. Each option awards points to specific roles:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>
                      Each option typically awards <strong>+2 points</strong> to
                      one role
                    </li>
                    <li>
                      Other roles receive <strong>0 points</strong> for that
                      question
                    </li>
                    <li>
                      These are considered "strong signals" because they clearly
                      indicate a role preference
                    </li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                    Example: "What concerns you most?" → Each answer option maps
                    to one role and gives it +2 points.
                  </p>
                </div>

                {/* Multiple Choice */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Multiple Choice Questions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    These questions let you select{" "}
                    <strong>up to 2 options</strong>. Each selected option
                    contributes points:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>
                      Each selected option awards <strong>+1 point</strong> to
                      one role
                    </li>
                    <li>
                      You can select multiple options, so multiple roles can
                      receive points
                    </li>
                    <li>
                      These provide "moderate signals" about your preferences
                    </li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                    Example: "Which tasks do you find most engaging? (Select up
                    to 2)" → Each selected option gives +1 point to its role.
                  </p>
                </div>

                {/* Likert Scale */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Likert Scale Questions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    These questions ask you to rate your agreement on a scale
                    (Strongly Disagree to Strongly Agree):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>
                      Each scale position awards different point values to
                      different roles
                    </li>
                    <li>
                      Extreme positions (Strongly Disagree/Agree) typically
                      award <strong>+2 points</strong> (strong signals)
                    </li>
                    <li>
                      Middle positions award <strong>+1 point</strong> or{" "}
                      <strong>0 points</strong> (weaker signals)
                    </li>
                    <li>Some positions may award points to multiple roles</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                    Example: "I prefer to slow down briefly to reduce future
                    rework" → Strongly Agree might give +2 to QA, while Strongly
                    Disagree gives +2 to FE.
                  </p>
                </div>
              </div>
            </section>

            {/* Score Calculation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How Your Final Score is Calculated
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Points accumulate:</strong> As you answer each
                  question, points are added to each role's total score based on
                  your selections.
                </li>
                <li>
                  <strong>All questions count:</strong> Every question
                  contributes to your final scores. There are 10 questions
                  total.
                </li>
                <li>
                  <strong>Role totals:</strong> After all questions, each role
                  (BE, FE, QA, PM) has a total point count.
                </li>
                <li>
                  <strong>Ranking:</strong> Roles are ranked from highest to
                  lowest total score.
                </li>
              </ol>
            </section>

            {/* Role Assignment */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How Your Role is Determined
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your primary role is the one with the highest total score.
                However, the system uses tie-breaking logic to handle close
                scores:
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 rounded">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Tie-Breaking Rules
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>First:</strong> Highest total score wins. If two
                    roles have the same total score, move to step 2.
                  </li>
                  <li>
                    <strong>Second:</strong> Count "strong signals" (+2 point
                    answers). The role with more strong signals wins. If still
                    tied, move to step 3.
                  </li>
                  <li>
                    <strong>Third:</strong> If scores and strong signals are
                    equal, roles are considered tied and shown as "Role1 +
                    Role2" (e.g., "BE + FE").
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Single Primary Role
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    If one role has the highest score (or wins after
                    tie-breaking), it becomes your <strong>Primary Role</strong>
                    . The role with the second-highest score becomes your{" "}
                    <strong>Secondary Role</strong>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Tied Roles
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    If two roles are tied for first place (same score AND same
                    number of strong signals), both are shown as your primary
                    role (e.g., "BE + FE"). This indicates you have balanced
                    strengths across both roles.
                  </p>
                </div>
              </div>
            </section>

            {/* Skill Tags */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Skill Tags and Evidence
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In addition to scores, the system tracks:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Skill Tags:</strong> Each answer option has associated
                  skill tags (like "Root-cause thinking", "User empathy", etc.).
                  These are collected and shown as your "Strongest Signals" on
                  your results page.
                </li>
                <li>
                  <strong>Evidence Highlights:</strong> Answers that gave +2
                  points (strong signals) are highlighted as evidence explaining
                  why you fit a particular role.
                </li>
              </ul>
            </section>

            {/* Example */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Example Calculation
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Let's say you answer 10 questions:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li>
                    5 forced-choice questions where you pick options that give
                    +2 to BE
                  </li>
                  <li>
                    3 multiple-choice questions where you select options giving
                    +1 to FE
                  </li>
                  <li>2 likert questions where you give +2 to QA</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Your totals would be:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>BE: 10 points (5 × 2)</li>
                  <li>FE: 3 points (3 × 1)</li>
                  <li>QA: 4 points (2 × 2)</li>
                  <li>PM: 0 points</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  Result: <strong>BE (Backend Engineer)</strong> is your primary
                  role with 10 points, and <strong>QA</strong> is your secondary
                  role with 4 points.
                </p>
              </div>
            </section>

            {/* Transparency Note */}
            <section className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Transparency
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                This scoring system is designed to be fair and transparent.
                Every answer contributes to your role fit, and the calculations
                are consistent for everyone. The goal is to help you understand
                your natural strengths and preferences, not to label or limit
                you.
              </p>
            </section>

            {/* Back to Quiz */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/quiz"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Take the Quiz →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
