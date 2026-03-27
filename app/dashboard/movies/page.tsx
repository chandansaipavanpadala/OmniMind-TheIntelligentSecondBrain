import { AgentView } from "@/components/agent-view";

export default function MoviesPage() {
  return (
    <AgentView
      agentName="Movies"
      tableName="movie_watchlist"
      icon="🎬"
      color="from-rose-500 to-pink-400"
      columns={[
        { key: "title", label: "Movie / Show" },
        { key: "platform", label: "Source URL" },
      ]}
      searchColumns={["title", "platform"]}
    />
  );
}
