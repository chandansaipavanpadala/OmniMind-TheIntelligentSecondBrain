import { AgentView } from "@/components/agent-view";

export default function FoodPage() {
  return (
    <AgentView
      agentName="Food"
      tableName="recipes"
      icon="🍜"
      color="from-orange-500 to-amber-400"
      columns={[
        { key: "dish_name", label: "Dish" },
        { key: "instructions", label: "AI Summary" },
        { key: "insta_url", label: "Source URL" },
      ]}
      searchColumns={["dish_name", "instructions", "insta_url"]}
    />
  );
}
