import { Clock } from "lucide-react";
import { EmptyState, PageHeader, PageShell, Panel } from "../../components/page/PageKit";

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <PageShell>
      <PageHeader title={title} />
      <Panel>
        <EmptyState
          icon={Clock}
          title="Coming soon"
          description="This page is under construction. We're working on something great!"
        />
      </Panel>
    </PageShell>
  );
};

export default PlaceholderPage;
