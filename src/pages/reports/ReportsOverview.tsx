// @ts-nocheck
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PageHeader, PageShell, Panel } from "../../components/page/PageKit";
import { flattenItems, reportPath, reportSections } from "./reportsCatalog";

const ReportsOverview = () => (
  <PageShell>
    <PageHeader eyebrow="Reports" title="Reports Overview" description="Pick a report to run, grouped the same way as the menu." />
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {reportSections.map((section) => (
        <Panel key={section.slug} title={section.title} description={section.blurb}>
          {section.reports ? (
            <ul className="space-y-1">
              {section.reports.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={reportPath(section.slug, r.slug)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#155dfd]"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.items && <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-500">{flattenItems(r.items).length}</span>}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              to={reportPath(section.slug)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#155dfd]"
            >
              <span>Open {section.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </Panel>
      ))}
    </div>
  </PageShell>
);

export default ReportsOverview;
