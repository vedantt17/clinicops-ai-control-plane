import { ControlPlane } from "@/components/control-plane";
import { runSimulation } from "@/lib/workflow-engine";

export default function Home() {
  return <ControlPlane initialSnapshot={runSimulation(17)} />;
}
