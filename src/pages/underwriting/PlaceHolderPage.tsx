import { Clock } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="bg-blue-50 rounded-full p-4 mb-6">
            <Clock size={40} className="text-[#0d47a1]" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            This page is under construction. We're working on something great!
          </p>

          {/* Status pill */}
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">In progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;