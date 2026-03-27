import { AgentView } from "@/components/agent-view";

export default function IdeasPage() {
  return (
    <AgentView
      agentName="Knowledge Base"
      tableName="startup_ideas"
      icon="💡"
      color="from-violet-500 to-purple-400"
      columns={[
        { key: "title", label: "Title / Source" },
        { key: "description", label: "Description" },
      ]}
      searchColumns={["title", "description"]}
    />
  );
}
