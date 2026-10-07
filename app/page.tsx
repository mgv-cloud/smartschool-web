import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-brand-700">SmartSchool AI</h1>
        <p className="text-gray-600">The Intelligent Operating System for Modern Schools</p>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/register-school"
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
          >
            Set up a new school
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 hover:border-brand-500 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
