import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ProposalsOverview = () => {
  const categories = [
    {
      title: "Investment Link Schemes",
      path: "/proposals/investment-link",
      icon: "💼",
      description: "Review investment-linked proposals",
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      iconBg: "bg-blue-500",
    },
    {
      title: "Traditional Schemes",
      path: "/proposals/traditional",
      icon: "💼",
      description: "Process traditional insurance proposals",
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      iconBg: "bg-blue-500",
    },
    {
      title: "Group Life Proposals",
      path: "/proposals/group",
      icon: "🏢",
      description: "Manage group life proposals",
      color: "bg-green-50 border-green-200 hover:border-green-400",
      iconBg: "bg-green-500",
    },
    {
      title: "Policy History",
      path: "/proposals/policy-history",
      icon: "📜",
      description: "Handle policy history",
      color: "bg-orange-50 border-orange-200 hover:border-orange-400",
      iconBg: "bg-orange-500",
    },
    // {
    //   title: "Health Proposals",
    //   path: "/proposals/health",
    //   icon: "🏥",
    //   description: "Process health insurance proposals",
    //   color: "bg-red-50 border-red-200 hover:border-red-400",
    //   iconBg: "bg-red-500",
    // },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] m-0">
          Proposals Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage proposal workflows across all categories.
        </p>
      </div>

      {/* Quick Access Categories */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className={`block border-2 rounded-lg p-5 transition-all ${category.color}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg ${category.iconBg} flex items-center justify-center text-white text-2xl flex-shrink-0`}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {category.title}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
      </div>
       {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Ready to create a new proposal?
            </h3>
            <p className="text-sm text-gray-600">
              Choose a category above to start creating proposals for your
              customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalsOverview;
