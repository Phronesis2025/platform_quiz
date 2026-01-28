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
              scores and which role you&apos;re assigned to.
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
                      These are considered &quot;strong signals&quot; because
                      they clearly indicate a role preference
                    </li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                    Example: &quot;What concerns you most?&quot; → Each answer
                    option maps to one role and gives it +2 points.
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
                      These provide &quot;moderate signals&quot; about your
                      preferences
                    </li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic">
                    Example: &quot;Which tasks do you find most engaging?
                    (Select up to 2)&quot; → Each selected option gives +1 point
                    to its role.
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
                    Example: &quot;I prefer to slow down briefly to reduce
                    future rework&quot; → Strongly Agree might give +2 to QA,
                    while Strongly Disagree gives +2 to FE.
                  </p>
                </div>
              </div>
            </section>

            {/* Bonus Questions */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Bonus Questions for Enhanced Accuracy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The quiz includes a bank of 12 additional Likert-scale questions
                that may be shown to improve accuracy:
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 mb-4 rounded">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  When Bonus Questions Appear
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Tie-Breaker Mode:</strong> If your top two roles are
                    within 2 points after the core questions, you&apos;ll see
                    2-3 bonus questions specifically chosen to help
                    differentiate between those roles.
                  </li>
                  <li>
                    <strong>Random Selection:</strong> If your scores are more
                    clearly separated, you&apos;ll see 2 randomly selected bonus
                    questions from the bank (this selection is deterministic
                    based on your name, so results are reproducible).
                  </li>
                </ul>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Bonus questions are all Likert-scale and scored the same way as
                regular Likert questions (+1 for moderate positions, +2 for
                strong positions). They contribute to your final scores just
                like the core questions.
              </p>
            </section>

            {/* Score Calculation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How Your Final Score is Calculated
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Points accumulate:</strong> As you answer each
                  question, points are added to each role&apos;s total score
                  based on your selections.
                </li>
                <li>
                  <strong>All questions count:</strong> Every question
                  contributes to your final scores. You&apos;ll answer 10 core
                  questions, plus up to 3 bonus questions (if shown), for a
                  total of 10-13 questions.
                </li>
                <li>
                  <strong>Role totals:</strong> After all questions, each role
                  (BE, FE, QA, PM) has a total point count.
                </li>
                <li>
                  <strong>Ranking:</strong> Roles are ranked from highest to
                  lowest total score.
                </li>
                <li>
                  <strong>Dominance Score:</strong> The difference between your
                  top role&apos;s score and your second role&apos;s score. A
                  higher dominance score indicates a clearer primary role fit.
                </li>
                <li>
                  <strong>Confidence Band:</strong> Based on your dominance
                  score and whether roles are tied, you&apos;re assigned a
                  confidence level: <strong>Strong</strong> (≥6 point
                  difference), <strong>Clear</strong> (3-5 point difference),{" "}
                  <strong>Split</strong> (≤2 point difference), or{" "}
                  <strong>Hybrid</strong> (tied roles).
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
                    <strong>Second:</strong> Count &quot;strong signals&quot;
                    (+2 point answers). The role with more strong signals wins.
                    If still tied, move to step 3.
                  </li>
                  <li>
                    <strong>Third:</strong> If scores and strong signals are
                    equal, roles are considered tied and shown as &quot;Role1 +
                    Role2&quot; (e.g., &quot;BE + FE&quot;).
                  </li>
                </ol>
              </div>

              <div className="space-y-3 mb-4">
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
                    role (e.g., &quot;BE + FE&quot;). This indicates you have
                    balanced strengths across both roles and results in a{" "}
                    <strong>Hybrid</strong> confidence band.
                  </p>
                </div>
              </div>

              {/* Confidence Bands */}
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Understanding Confidence Bands
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Your results include a confidence band that indicates how
                  clear your role assignment is:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Strong:</strong> Your top role leads by 6+ points.
                    This indicates a very clear, confident role fit.
                  </li>
                  <li>
                    <strong>Clear:</strong> Your top role leads by 3-5 points.
                    This indicates a confident role assignment.
                  </li>
                  <li>
                    <strong>Split:</strong> Your top role leads by 2 points or
                    less. This suggests you have balanced strengths across
                    multiple roles.
                  </li>
                  <li>
                    <strong>Hybrid:</strong> Two or more roles are tied for
                    first place. This indicates a balanced profile with
                    strengths across multiple roles.
                  </li>
                </ul>
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
                  skill tags (like &quot;Root-cause thinking&quot;, &quot;User
                  empathy&quot;, etc.). These are collected and shown as your
                  &quot;Strongest Signals&quot; on your results page.
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
                  Let&apos;s say you answer 10 core questions:
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
                  After core questions, your totals would be:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4 mb-4">
                  <li>BE: 10 points (5 × 2)</li>
                  <li>FE: 3 points (3 × 1)</li>
                  <li>QA: 4 points (2 × 2)</li>
                  <li>PM: 0 points</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Since BE (10) and QA (4) are more than 2 points apart, you
                  might see 2 bonus questions (randomly selected). Let&apos;s
                  say you answer them and get +1 to BE and +1 to QA:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4 mb-4">
                  <li>BE: 11 points (10 + 1)</li>
                  <li>FE: 3 points</li>
                  <li>QA: 5 points (4 + 1)</li>
                  <li>PM: 0 points</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  Result: <strong>BE (Backend Engineer)</strong> is your primary
                  role with 11 points, and <strong>QA</strong> is your secondary
                  role with 5 points. Your dominance score is 6 (11 - 5), which
                  gives you a <strong>Strong</strong> confidence band.
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
