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
            How It Works
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            {/* Purpose */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Why This Tool Exists
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This quiz helps identify how individuals naturally approach
                problem-solving, risk, and delivery under pressure. It&apos;s
                designed to reduce operational risk by aligning responsibilities
                with demonstrated thinking patterns.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Important:</strong> This is not a performance evaluation
                and does not override job titles. Results are intended to
                provide insight and alignment, not to label or limit anyone.
              </p>
            </section>

            {/* Taking the Quiz */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What Happens When You Take the Quiz
              </h2>
              <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Time commitment:</strong> You&apos;ll answer 10-13
                  questions (typically 10 core questions, plus up to 3 bonus
                  questions if needed for accuracy). This takes approximately
                  5-10 minutes.
                </li>
                <li>
                  <strong>What it measures:</strong> The quiz identifies your
                  natural thinking patterns, preferences, and risk mindset when
                  approaching technical problems and operational challenges.
                </li>
                <li>
                  <strong>Question types:</strong> You&apos;ll see different
                  question formats—some ask you to pick one option, others let
                  you select multiple options, and some ask you to rate your
                  agreement on a scale.
                </li>
                <li>
                  <strong>What you&apos;ll see:</strong> After completing the
                  quiz, you&apos;ll receive results showing:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Your ranked role fit (all four roles with scores)</li>
                    <li>Primary and secondary role assignments</li>
                    <li>Skill tags that reflect your strongest signals</li>
                    <li>
                      A confidence band indicating how clear your role fit is
                    </li>
                    <li>Recommendations for how to best use your strengths</li>
                  </ul>
                </li>
              </ul>
            </section>

            {/* Understanding Results */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Understanding Your Role Fit Results
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Primary Role
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    This is the role where your thinking patterns and
                    preferences align most strongly. It represents where you
                    naturally excel in problem-solving approaches, not your job
                    title or what you&apos;re allowed to do.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Secondary Role
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    This is your second-strongest role fit. Many people have
                    strengths across multiple roles, and this shows where else
                    you naturally contribute. It doesn&apos;t mean you&apos;re
                    limited to these two roles.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Confidence Band
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    This indicates how clear your primary role assignment is:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                    <li>
                      <strong>Strong:</strong> Very clear role fit—your primary
                      role stands out significantly from others
                    </li>
                    <li>
                      <strong>Clear:</strong> Confident role assignment—your
                      primary role is well-defined
                    </li>
                    <li>
                      <strong>Split:</strong> Balanced strengths—you show
                      similar alignment across multiple roles
                    </li>
                    <li>
                      <strong>Hybrid:</strong> Tied roles—you have equal
                      strengths across two or more roles
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded mt-6">
                <p className="text-gray-900 dark:text-white font-semibold mb-2">
                  Remember:
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  These results are about insight and alignment, not labeling or
                  performance evaluation. They help teams understand how to best
                  leverage your natural strengths while supporting growth in
                  other areas.
                </p>
              </div>
            </section>

            {/* Scoring Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How Scoring Works (High-Level)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The scoring system identifies patterns in your answers that
                reflect how you think under pressure:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Your answers contribute to patterns that reflect how you think
                  under pressure
                </li>
                <li>
                  Stronger signals (clear preferences) count more than moderate
                  signals
                </li>
                <li>
                  This doesn&apos;t affect your job title or what you&apos;re
                  allowed to do
                </li>
                <li>
                  The system looks at all your answers together to identify your
                  strongest role alignment
                </li>
                <li>
                  Bonus questions may appear if your initial answers show very
                  close alignment across roles—these help refine the results
                </li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 italic">
                The scoring system is transparent and consistent—everyone&apos;s
                answers are evaluated using the same approach. The goal is to
                provide accurate insights, not to create arbitrary categories.
              </p>
            </section>

            {/* FAQ */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    How long does it take?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Most people complete the quiz in 5-10 minutes. You&apos;ll
                    answer 10 core questions, and possibly 2-3 bonus questions
                    if needed for accuracy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Will anyone see my individual answers?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    No. Only your role fit results, skill tags, and confidence
                    band are visible to leadership. Your individual answers are
                    not shown—only the patterns and insights derived from them.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Can results change over time?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes. Your thinking patterns and preferences can evolve as
                    you gain experience and develop new skills. You can retake
                    the quiz at any time to see how your role fit may have
                    changed. Results are a snapshot of your current approach,
                    not a permanent label.
                  </p>
                </div>
              </div>
            </section>

            {/* Transparency Note */}
            <section className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Transparency
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                This tool is designed to be fair, transparent, and helpful. The
                scoring system is consistent for everyone, and results are based
                solely on your answers. The goal is to help you and your team
                understand your natural strengths and preferences, not to limit
                or label you.
              </p>
            </section>

            {/* Back to Quiz */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
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
