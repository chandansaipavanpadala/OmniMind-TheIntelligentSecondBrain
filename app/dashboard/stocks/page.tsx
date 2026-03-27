import { AgentView } from "@/components/agent-view";

export default function StocksPage() {
  return (
    <AgentView
      agentName="Stocks"
      tableName="stock_tracker"
      icon="📈"
      color="from-emerald-500 to-green-400"
      columns={[
        { key: "ticker", label: "Source / Ticker" },
        { key: "notes", label: "AI Notes" },
      ]}
      searchColumns={["ticker", "notes"]}
    />
  );
}
