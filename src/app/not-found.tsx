import PageHeader from "@/src/components/ui/PageHeader";
import { ButtonLink } from "@/src/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="page">
      <PageHeader
        title="Page not found"
        subtitle="This address does not match a page in Attesta."
        actions={<ButtonLink href="/" variant="primary">Go to Overview</ButtonLink>}
      />
    </div>
  );
}
