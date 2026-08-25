import { ControlPlane } from "@/components/control-plane";
import { runEvaluation } from "@/lib/ai/evaluation";
import { runSimulation } from "@/lib/workflow-engine";

export default async function Home() {
  const evaluations = await Promise.all([
    runEvaluation("baseline-v1"),
    runEvaluation("guardrailed-v2"),
  ]);
  return <ControlPlane initialSnapshot={runSimulation(17)} evaluations={evaluations} />;
}
