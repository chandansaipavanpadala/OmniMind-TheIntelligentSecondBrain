import { AgentView } from "@/components/agent-view";

export default function TravelPage() {
  return (
    <AgentView
      agentName="Travel"
      tableName="travel_spots"
      icon="✈️"
      color="from-sky-500 to-cyan-400"
      columns={[
        { key: "ai_tips", label: "AI Summary" },
        { key: "insta_url", label: "Source URL" },
      ]}
      searchColumns={["ai_tips", "insta_url"]}
      enableGeolocation={true}
    />
  );
}
