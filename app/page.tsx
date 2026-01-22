import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        {/* Main heading */}
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Platform Quiz
        </h1>
        
        {/* Description paragraph */}
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
          Welcome to our interactive quiz platform! Test your knowledge, challenge yourself,
          and see how well you understand various topics. Our quiz system is designed to be
          engaging, educational, and fun.
        </p>
        
        {/* Features list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            What you can do:
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
              <span>Take quizzes on various topics</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
              <span>View your results and track your progress</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
              <span>Review your submission history</span>
            </li>
          </ul>
        </div>
        
        {/* Call to action button */}
        <Link
          href="/quiz"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Start Quiz
        </Link>
      </div>
    </div>
  );
}
