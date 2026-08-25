"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  Gauge,
  GitBranch,
  HeartPulse,
  Play,
  RefreshCw,
  Route,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationSnapshot, WorkflowRun, WorkflowStatus } from "@/lib/types";

type View = "control" | "roadmap" | "governance";

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  completed: "Completed",
  human_review: "Human review",
  dead_letter: "Dead letter",
};

const STATUS_CLASS: Record<WorkflowStatus, string> = {
  completed: "success",
  human_review: "review",
  dead_letter: "danger",
};

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function Metric({ label, value, context, icon: Icon, tone = "neutral" }: { label: string; value: string; context: string; icon: typeof Activity; tone?: string }) {
  return (
    <article className={`metric metric-${tone}`}>
      <div className="metric-label"><Icon size={17} /> {label}</div>
      <strong>{value}</strong>
      <span>{context}</span>
    </article>
  );
}

function StatusPill({ status }: { status: WorkflowStatus }) {
  return <span className={`status status-${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

function RunDetail({ run, close }: { run: WorkflowRun; close: () => void }) {
  return (
    <aside className="detail-panel" aria-label="Workflow run detail">
      <div className="detail-heading">
        <div><span>RUN DETAIL</span><h3>{run.id}</h3></div>
        <button className="icon-button" onClick={close} aria-label="Close detail">×</button>
      </div>
      <StatusPill status={run.status} />
      <dl>
        <div><dt>Workflow</dt><dd>{run.workflow}</dd></div>
        <div><dt>Site</dt><dd>{run.site}</dd></div>
        <div><dt>Channel</dt><dd>{run.channel}</dd></div>
        <div><dt>Hashed patient</dt><dd>{run.patientHash}</dd></div>
        <div><dt>Attempts</dt><dd>{run.attempts}</dd></div>
        <div><dt>Latency</dt><dd>{formatNumber(run.latencyMs)} ms</dd></div>
        <div><dt>Owner</dt><dd>{run.owner}</dd></div>
      </dl>
      <div className="detail-note"><AlertTriangle size={17} /><p>{run.reason}</p></div>
      <div className="privacy-note"><ShieldCheck size={17} />No name, address, birth date, contact detail, or clinical note is stored.</div>
    </aside>
  );
}

export function ControlPlane({ initialSnapshot }: { initialSnapshot: SimulationSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [view, setView] = useState<View>("control");
  const [site, setSite] = useState("All sites");
  const [workflow, setWorkflow] = useState("All workflows");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredRuns = useMemo(() => snapshot.runs.filter((run) =>
    (site === "All sites" || run.site === site) && (workflow === "All workflows" || run.workflow === workflow)
  ), [snapshot, site, workflow]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, { workflow: string; completed: number; review: number; dead: number }>();
    filteredRuns.forEach((run) => {
      const current = grouped.get(run.workflow) ?? { workflow: run.workflow.replace(" verification", "").replace(" authorization", " auth"), completed: 0, review: 0, dead: 0 };
      if (run.status === "completed") current.completed += 1;
      if (run.status === "human_review") current.review += 1;
      if (run.status === "dead_letter") current.dead += 1;
      grouped.set(run.workflow, current);
    });
    return [...grouped.values()];
  }, [filteredRuns]);

  const exceptions = filteredRuns.filter((run) => run.status !== "completed").slice(0, 8);

  async function rerun() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: snapshot.seed + 1 }),
      });
      if (!response.ok) throw new Error("Simulation request failed");
      setSnapshot((await response.json()) as SimulationSnapshot);
      setSelectedRun(null);
    } catch {
      setError("The simulation could not be refreshed. The current verified snapshot remains available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark"><HeartPulse size={22} /></div>
          <div><h1>ClinicOps AI Control Plane</h1><p>Healthcare automation reliability and governance</p></div>
        </div>
        <div className="header-actions">
          <span className="simulation-badge"><ShieldCheck size={15} /> Synthetic, PHI-free simulation</span>
          <button className="primary-button" onClick={rerun} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}
            {loading ? "Running" : "Run simulation"}
          </button>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Workspace views">
        <button className={view === "control" ? "active" : ""} onClick={() => setView("control")}><Gauge size={16} /> Control room</button>
        <button className={view === "roadmap" ? "active" : ""} onClick={() => setView("roadmap")}><Route size={16} /> Automation roadmap</button>
        <button className={view === "governance" ? "active" : ""} onClick={() => setView("governance")}><FileCheck2 size={16} /> Governance</button>
      </nav>

      {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /> {error}</div>}

      {view === "control" && (
        <>
          <section className="toolbar" aria-label="Simulation filters">
            <div><span>Snapshot</span><strong>Seed {snapshot.seed} · {snapshot.fhirResourceCount} FHIR resources · {snapshot.metrics.totalRuns} runs</strong></div>
            <div className="filter-group">
              <label>Site<select value={site} onChange={(event) => setSite(event.target.value)}><option>All sites</option>{[...new Set(snapshot.runs.map((run) => run.site))].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Workflow<select value={workflow} onChange={(event) => setWorkflow(event.target.value)}><option>All workflows</option>{[...new Set(snapshot.runs.map((run) => run.workflow))].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </section>

          <section className="metric-grid" aria-label="Key metrics">
            <Metric label="Success rate" value={`${snapshot.metrics.successRate}%`} context={`${snapshot.metrics.deadLetterRate}% dead-letter rate`} icon={CheckCircle2} tone="green" />
            <Metric label="Human review" value={`${snapshot.metrics.humanReviewRate}%`} context="Policy-gated exception rate" icon={Users} tone="amber" />
            <Metric label="P95 latency" value={`${formatNumber(snapshot.metrics.p95LatencyMs)} ms`} context={`${snapshot.metrics.fallbackRate}% used portal fallback`} icon={Clock3} tone="blue" />
            <Metric label="Modeled capacity" value={`${snapshot.metrics.modeledHoursAvoided} hrs`} context={`Scenario estimate · $${snapshot.metrics.totalModelCostUsd} model cost`} icon={CircleDollarSign} tone="coral" />
          </section>

          <section className="control-grid">
            <article className="panel chart-panel">
              <div className="panel-heading"><div><span>WORKFLOW HEALTH</span><h2>Outcomes by automation</h2></div><Activity size={19} /></div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="workflow" tick={{ fontSize: 11, fill: "#52606d" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#52606d" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f4f6f8" }} contentStyle={{ borderRadius: 6, border: "1px solid #d9dee5", fontSize: 12 }} />
                    <Bar dataKey="completed" stackId="a" fill="#16794b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="review" stackId="a" fill="#d18b16" />
                    <Bar dataKey="dead" stackId="a" fill="#c84b4b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend"><span><i className="legend-green" />Completed</span><span><i className="legend-amber" />Human review</span><span><i className="legend-red" />Dead letter</span></div>
            </article>

            <article className="panel integration-panel">
              <div className="panel-heading"><div><span>INTEGRATIONS</span><h2>System posture</h2></div><GitBranch size={19} /></div>
              <ul className="integration-list">
                <li><div className="integration-icon green"><Database size={17} /></div><div><strong>FHIR R4 adapter</strong><span>{snapshot.fhirResourceCount} synthetic resources validated</span></div><CheckCircle2 size={17} /></li>
                <li><div className="integration-icon blue"><Workflow size={17} /></div><div><strong>Payer API</strong><span>Retries, idempotency, and contract checks</span></div><CheckCircle2 size={17} /></li>
                <li><div className="integration-icon amber"><Bot size={17} /></div><div><strong>Portal robot</strong><span>{snapshot.metrics.fallbackRate}% fallback rate in simulation</span></div><AlertTriangle size={17} /></li>
                <li><div className="integration-icon coral"><ShieldCheck size={17} /></div><div><strong>Privacy gate</strong><span>{snapshot.prohibitedFieldViolations} prohibited FHIR fields detected</span></div><CheckCircle2 size={17} /></li>
              </ul>
              <Link href="/portal" className="text-link">Open synthetic payer portal <ArrowUpRight size={15} /></Link>
            </article>
          </section>

          <section className="panel exception-panel">
            <div className="panel-heading"><div><span>EXCEPTION QUEUE</span><h2>Cases requiring intervention</h2></div><span className="queue-count">{filteredRuns.filter((run) => run.status !== "completed").length} open</span></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Run</th><th>Workflow</th><th>Site</th><th>Status</th><th>Attempts</th><th>Owner</th><th aria-label="Open" /></tr></thead>
                <tbody>{exceptions.map((run) => (
                  <tr key={run.id} onClick={() => setSelectedRun(run)}>
                    <td data-label="Run"><strong>{run.id}</strong><span>{run.patientHash}</span></td>
                    <td data-label="Workflow">{run.workflow}</td>
                    <td data-label="Site">{run.site}</td>
                    <td data-label="Status"><StatusPill status={run.status} /></td>
                    <td data-label="Attempts">{run.attempts}</td>
                    <td data-label="Owner">{run.owner}</td>
                    <td className="open-cell" aria-label={`Open ${run.id}`}><ChevronRight size={16} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {view === "roadmap" && (
        <section className="roadmap-layout">
          <div className="roadmap-intro"><span>AUTOMATION ROADMAP</span><h2>Prioritize leverage with controls attached</h2><p>Every opportunity combines synthetic volume and handling-time assumptions with an explicit control. Hours are modeled scenarios, not realized savings.</p></div>
          <div className="roadmap-columns">
            {(["Now", "Next", "Later"] as const).map((lane) => (
              <section key={lane} className="roadmap-lane"><div className="lane-title"><strong>{lane}</strong><span>{snapshot.roadmap.filter((item) => item.lane === lane).length} initiatives</span></div>
                {snapshot.roadmap.filter((item) => item.lane === lane).map((item) => (
                  <article className="roadmap-item" key={item.id}>
                    <div className="roadmap-top"><span>{item.workflow}</span><span className={`confidence confidence-${item.confidence.toLowerCase()}`}>{item.confidence}</span></div>
                    <h3>{item.title}</h3>
                    <div className="roadmap-metrics"><span><strong>{formatNumber(item.modeledMonthlyHours, 1)}</strong> modeled hrs/mo</span><span><strong>{item.impact}/5</strong> impact</span><span><strong>{item.effort}/5</strong> effort</span></div>
                    <p><ShieldCheck size={14} /> {item.control}</p>
                  </article>
                ))}
              </section>
            ))}
          </div>
        </section>
      )}

      {view === "governance" && (
        <section className="governance-grid">
          <article className="panel vendor-panel">
            <div className="panel-heading"><div><span>TOOLING STRATEGY</span><h2>Vendor and approach scorecard</h2></div><CircleDollarSign size={19} /></div>
            <div className="vendor-list">{snapshot.vendors.sort((a, b) => b.weightedScore - a.weightedScore).map((vendor, index) => (
              <article key={vendor.vendor} className="vendor-row"><div className="rank">0{index + 1}</div><div className="vendor-main"><div><strong>{vendor.vendor}</strong><span>{vendor.approach}</span></div><p>{vendor.recommendation}</p></div><div className="score"><strong>{vendor.weightedScore}</strong><span>/ 100</span></div></article>
            ))}</div>
            <p className="method-note">Weighted score: reliability 35%, security 30%, implementation 20%, cost 15%. Scenario inputs are documented in the repository.</p>
          </article>
          <article className="panel audit-panel">
            <div className="panel-heading"><div><span>TRACEABILITY</span><h2>PHI-safe audit events</h2></div><ShieldCheck size={19} /></div>
            <div className="audit-list">{snapshot.auditEvents.slice(0, 12).map((event) => (
              <div className="audit-row" key={event.id}><div className={`audit-dot audit-${event.action.toLowerCase().replaceAll("_", "-")}`} /><div><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.workflowRunId} · {event.patientHash}</span><p>{event.detail}</p></div><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
            ))}</div>
          </article>
        </section>
      )}

      <footer><span>Built for transparent portfolio demonstration</span><span>FHIR R4 · deterministic simulation · no PHI · open source</span></footer>
      {selectedRun && <div className="detail-overlay" onClick={() => setSelectedRun(null)}><div onClick={(event) => event.stopPropagation()}><RunDetail run={selectedRun} close={() => setSelectedRun(null)} /></div></div>}
    </main>
  );
}
