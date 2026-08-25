"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Database, FileCheck2, FlaskConical, Gauge, GitBranch,
  HeartPulse, Play, RefreshCw, Route, ShieldCheck, TerminalSquare, Workflow, X, XCircle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgentVersion, EvaluationReport } from "@/lib/ai/types";
import type { SimulationSnapshot, WorkflowRun, WorkflowStatus } from "@/lib/types";

type View = "control" | "lab" | "roadmap" | "governance";
const STATUS_LABEL: Record<WorkflowStatus, string> = { completed: "Completed", human_review: "Human review", dead_letter: "Dead letter" };
const STATUS_CLASS: Record<WorkflowStatus, string> = { completed: "success", human_review: "review", dead_letter: "danger" };
const ACTION_LABEL = { complete: "Complete", human_review: "Human review", dead_letter: "Dead letter" } as const;

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function StatusPill({ status }: { status: WorkflowStatus }) {
  return <span className={`status status-${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

function MetricTile({ label, value, detail, tone = "plain" }: { label: string; value: string; detail: string; tone?: "plain" | "dark" | "safe" | "warn" }) {
  return <article className={`metric-tile metric-${tone}`}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function RunDetail({ run, close }: { run: WorkflowRun; close: () => void }) {
  return <aside className="detail-panel" aria-label="Workflow run detail">
    <div className="drawer-handle" />
    <div className="detail-heading"><div><span className="eyebrow">Run detail</span><h3>{run.id}</h3></div><button className="icon-button" onClick={close} aria-label="Close detail"><X size={18} /></button></div>
    <StatusPill status={run.status} />
    <dl>
      <div><dt>Workflow</dt><dd>{run.workflow}</dd></div><div><dt>Site</dt><dd>{run.site}</dd></div>
      <div><dt>Channel</dt><dd>{run.channel}</dd></div><div><dt>Hashed patient</dt><dd>{run.patientHash}</dd></div>
      <div><dt>Attempts</dt><dd>{run.attempts}</dd></div><div><dt>Latency</dt><dd>{formatNumber(run.latencyMs)} ms</dd></div>
      <div><dt>Owner</dt><dd>{run.owner}</dd></div>
    </dl>
    <div className="notice warning"><AlertTriangle size={17} /><p>{run.reason}</p></div>
    <div className="notice safe"><ShieldCheck size={17} /><p>No name, address, birth date, contact detail, or clinical note is stored.</p></div>
  </aside>;
}

function LabView({ evaluations }: { evaluations: EvaluationReport[] }) {
  const [version, setVersion] = useState<AgentVersion>("guardrailed-v2");
  const report = evaluations.find((item) => item.version === version) ?? evaluations[0];
  const baseline = evaluations.find((item) => item.version === "baseline-v1") ?? evaluations[0];
  const [selectedId, setSelectedId] = useState("eval-007");
  const selected = report.results.find((item) => item.caseId === selectedId) ?? report.results[0];

  return <section className="workspace-view lab-view">
    <div className="view-intro">
      <div><span className="eyebrow">Agent evaluation</span><h1>Trust is a test suite.</h1><p>Replay versioned agents against normal, ambiguous, and adversarial cases before they can touch an operational workflow.</p></div>
      <div className="mode-stack"><span className="mode-badge"><FlaskConical size={14} /> Replay mode</span><small>No live model or PHI</small></div>
    </div>
    <div className="version-bar">
      <div className="segmented" aria-label="Agent version">{evaluations.map((item) => <button key={item.version} className={version === item.version ? "active" : ""} onClick={() => setVersion(item.version)}>{item.label}</button>)}</div>
      <div className="version-meta"><span>{report.promptVersion}</span><span>{report.adapter}</span></div>
    </div>
    <section className="lab-metrics" aria-label="Agent evaluation metrics">
      <MetricTile label="Decision accuracy" value={`${report.metrics.decisionAccuracy}%`} detail={`${report.results.filter((item) => item.passed).length}/${report.results.length} expected actions`} tone="dark" />
      <MetricTile label="Unsafe auto-action" value={`${report.metrics.unsafeAutoActionRate}%`} detail={`${baseline.metrics.unsafeAutoActionRate}% in baseline`} tone={report.metrics.unsafeAutoActionRate === 0 ? "safe" : "warn"} />
      <MetricTile label="Calibration error" value={`${report.metrics.calibrationError}%`} detail="5-bin expected calibration error" />
      <MetricTile label="P95 latency" value={`${formatNumber(report.metrics.p95LatencyMs)} ms`} detail={`${formatNumber(report.metrics.totalTokens)} replayed tokens`} />
    </section>
    <section className="lab-workbench">
      <article className="eval-list-panel">
        <div className="section-heading"><div><span className="eyebrow">Evaluation corpus</span><h2>{report.results.length} replay cases</h2></div><span className="pass-count">{report.results.filter((item) => item.passed).length} passed</span></div>
        <div className="eval-list">{report.results.map((result) => <button key={result.caseId} className={selected.caseId === result.caseId ? "selected" : ""} onClick={() => setSelectedId(result.caseId)}>
          <span className={`result-icon ${result.passed ? "pass" : "fail"}`}>{result.passed ? <Check size={14} /> : <X size={14} />}</span>
          <span className="eval-copy"><strong>{result.title}</strong><small>{result.caseId} · {result.workflow}</small></span>
          {result.adversarial && <span className="adversarial-tag">Adversarial</span>}<ChevronRight size={15} />
        </button>)}</div>
      </article>
      <article className="trace-panel">
        <div className="trace-top"><div><span className="eyebrow">Execution trace</span><h2>{selected.title}</h2></div><span className={`risk risk-${selected.risk}`}>{selected.risk} risk</span></div>
        <div className="decision-strip"><div><span>Expected</span><strong>{ACTION_LABEL[selected.expectedAction]}</strong></div><ArrowUpRight size={17} /><div><span>Agent decision</span><strong>{ACTION_LABEL[selected.action]}</strong></div><div className="confidence-ring"><strong>{Math.round(selected.confidence * 100)}</strong><span>confidence</span></div></div>
        <div className="trace-list">{selected.trace.map((trace) => <div className="trace-row" key={`${selected.caseId}-${trace.step}`}>
          <span className={`trace-state ${trace.status}`}>{trace.status === "blocked" ? <XCircle size={15} /> : <CheckCircle2 size={15} />}</span>
          <div><strong>{trace.tool}</strong><p>{trace.detail}</p></div><code>{trace.durationMs}ms</code>
        </div>)}</div>
        <div className="evidence-box"><div><span className="eyebrow">Decision record</span><strong>{selected.policyGate}</strong></div><p>{selected.rationale}</p><div className="citation-row">{selected.citations.map((citation) => <code key={citation}>{citation}</code>)}</div></div>
        <div className="trace-footer"><span>{selected.inputTokens + selected.outputTokens} tokens</span><span>${selected.estimatedCostUsd.toFixed(4)} estimated</span><span>{selected.latencyMs} ms</span></div>
      </article>
    </section>
  </section>;
}

export function ControlPlane({ initialSnapshot, evaluations }: { initialSnapshot: SimulationSnapshot; evaluations: EvaluationReport[] }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [view, setView] = useState<View>("control");
  const [site, setSite] = useState("All sites");
  const [workflow, setWorkflow] = useState("All workflows");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const filteredRuns = useMemo(() => snapshot.runs.filter((run) => (site === "All sites" || run.site === site) && (workflow === "All workflows" || run.workflow === workflow)), [snapshot, site, workflow]);
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
  const nav = [
    { id: "control" as const, label: "Control room", icon: Gauge }, { id: "lab" as const, label: "AI Lab", icon: FlaskConical },
    { id: "roadmap" as const, label: "Roadmap", icon: Route }, { id: "governance" as const, label: "Governance", icon: FileCheck2 },
  ];

  async function rerun() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/simulation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: snapshot.seed + 1 }) });
      if (!response.ok) throw new Error("Simulation request failed");
      setSnapshot((await response.json()) as SimulationSnapshot); setSelectedRun(null);
    } catch { setError("Refresh failed. The last verified snapshot remains available."); }
    finally { setLoading(false); }
  }

  return <main className="product-shell">
    <aside className="side-rail">
      <div className="product-mark"><span><HeartPulse size={19} /></span><div><strong>ClinicOps</strong><small>Control plane</small></div></div>
      <nav aria-label="Workspace views">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="rail-status"><span className="live-dot" /><div><strong>All systems nominal</strong><small>Replay environment</small></div></div>
    </aside>
    <div className="main-stage">
      <header className="command-bar"><div className="mobile-brand"><HeartPulse size={18} /><strong>ClinicOps</strong></div><div className="breadcrumb"><span>Operations</span><ChevronRight size={14} /><strong>{nav.find((item) => item.id === view)?.label}</strong></div><div className="command-actions"><span className="privacy-chip"><ShieldCheck size={14} /> Synthetic · PHI-free</span><button className="run-button" onClick={rerun} disabled={loading}>{loading ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}{loading ? "Running" : "Run simulation"}</button></div></header>
      <nav className="mobile-nav" aria-label="Mobile workspace views">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={16} /><span>{label}</span></button>)}</nav>
      {error && <div className="error-banner" role="alert"><AlertTriangle size={16} />{error}</div>}
      {view === "control" && <ControlView snapshot={snapshot} filteredRuns={filteredRuns} chartData={chartData} exceptions={exceptions} site={site} workflow={workflow} setSite={setSite} setWorkflow={setWorkflow} setSelectedRun={setSelectedRun} />}
      {view === "lab" && <LabView evaluations={evaluations} />}
      {view === "roadmap" && <RoadmapView snapshot={snapshot} />}
      {view === "governance" && <GovernanceView snapshot={snapshot} />}
      <footer><span>Public portfolio environment</span><span><TerminalSquare size={13} /> Deterministic replay · versioned prompts · no PHI</span></footer>
    </div>
    {selectedRun && <div className="detail-overlay" onClick={() => setSelectedRun(null)}><div onClick={(event) => event.stopPropagation()}><RunDetail run={selectedRun} close={() => setSelectedRun(null)} /></div></div>}
  </main>;
}

function ControlView({ snapshot, filteredRuns, chartData, exceptions, site, workflow, setSite, setWorkflow, setSelectedRun }: {
  snapshot: SimulationSnapshot; filteredRuns: WorkflowRun[]; chartData: Array<{workflow:string;completed:number;review:number;dead:number}>; exceptions: WorkflowRun[]; site:string; workflow:string; setSite:(value:string)=>void; setWorkflow:(value:string)=>void; setSelectedRun:(run:WorkflowRun)=>void;
}) {
  return <section className="workspace-view">
    <div className="view-intro"><div><span className="eyebrow">Live operations</span><h1>Operational AI, under control.</h1><p>Watch every workflow, exception, and fallback from source data to final action.</p></div><div className="snapshot-meta"><span>Snapshot</span><strong>Seed {snapshot.seed}</strong><small>{snapshot.fhirResourceCount} FHIR resources · {snapshot.metrics.totalRuns} runs</small></div></div>
    <section className="filter-bar" aria-label="Simulation filters"><div className="filter-copy"><Activity size={16} /><span>{filteredRuns.length} visible runs</span></div><div><label>Site<select value={site} onChange={(event) => setSite(event.target.value)}><option>All sites</option>{[...new Set(snapshot.runs.map((run) => run.site))].map((item) => <option key={item}>{item}</option>)}</select></label><label>Workflow<select value={workflow} onChange={(event) => setWorkflow(event.target.value)}><option>All workflows</option>{[...new Set(snapshot.runs.map((run) => run.workflow))].map((item) => <option key={item}>{item}</option>)}</select></label></div></section>
    <section className="metric-bento" aria-label="Key metrics"><MetricTile label="Workflow success" value={`${snapshot.metrics.successRate}%`} detail={`${snapshot.metrics.deadLetterRate}% dead-letter rate`} tone="dark" /><MetricTile label="Human review" value={`${snapshot.metrics.humanReviewRate}%`} detail="Policy-gated exceptions" tone="warn" /><MetricTile label="P95 latency" value={`${formatNumber(snapshot.metrics.p95LatencyMs)} ms`} detail={`${snapshot.metrics.fallbackRate}% fallback rate`} /><MetricTile label="Modeled capacity" value={`${snapshot.metrics.modeledHoursAvoided} hrs`} detail={`Scenario · $${snapshot.metrics.totalModelCostUsd}`} tone="safe" /></section>
    <section className="operations-grid">
      <article className="surface chart-panel"><div className="section-heading"><div><span className="eyebrow">Workflow health</span><h2>Outcomes by automation</h2></div><Activity size={18} /></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 14, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e7e7ea" /><XAxis dataKey="workflow" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6e6e73" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6e6e73" }} /><Tooltip cursor={{ fill: "#f5f5f7" }} contentStyle={{ border: "1px solid #dedee3", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="completed" stackId="a" fill="#34c759" /><Bar dataKey="review" stackId="a" fill="#ff9f0a" /><Bar dataKey="dead" stackId="a" fill="#ff453a" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div><div className="legend"><span><i className="green" />Completed</span><span><i className="amber" />Human review</span><span><i className="red" />Dead letter</span></div></article>
      <article className="surface integration-panel"><div className="section-heading"><div><span className="eyebrow">System posture</span><h2>Four controls online</h2></div><GitBranch size={18} /></div><div className="integration-stack"><div><span className="integration-glyph"><Database size={16} /></span><p><strong>FHIR R4 contract</strong><small>{snapshot.fhirResourceCount} resources validated</small></p><CheckCircle2 size={16} /></div><div><span className="integration-glyph"><Workflow size={16} /></span><p><strong>Payer API</strong><small>Retry + idempotency policy</small></p><CheckCircle2 size={16} /></div><div><span className="integration-glyph"><Bot size={16} /></span><p><strong>Portal fallback</strong><small>{snapshot.metrics.fallbackRate}% of runs</small></p><AlertTriangle className="amber-icon" size={16} /></div><div><span className="integration-glyph"><ShieldCheck size={16} /></span><p><strong>Privacy gate</strong><small>{snapshot.prohibitedFieldViolations} prohibited fields</small></p><CheckCircle2 size={16} /></div></div><Link href="/portal" className="inline-link">Open synthetic portal <ArrowUpRight size={14} /></Link></article>
    </section>
    <section className="surface exception-panel"><div className="section-heading"><div><span className="eyebrow">Exception queue</span><h2>Cases requiring intervention</h2></div><span className="count-badge">{filteredRuns.filter((run) => run.status !== "completed").length} open</span></div><div className="table-scroll"><table><thead><tr><th>Run</th><th>Workflow</th><th>Site</th><th>Status</th><th>Attempts</th><th>Owner</th><th /></tr></thead><tbody>{exceptions.map((run) => <tr key={run.id} onClick={() => setSelectedRun(run)}><td data-label="Run"><strong>{run.id}</strong><small>{run.patientHash}</small></td><td data-label="Workflow">{run.workflow}</td><td data-label="Site">{run.site}</td><td data-label="Status"><StatusPill status={run.status} /></td><td data-label="Attempts">{run.attempts}</td><td data-label="Owner">{run.owner}</td><td><ChevronRight size={15} /></td></tr>)}</tbody></table></div></section>
  </section>;
}

function RoadmapView({ snapshot }: { snapshot: SimulationSnapshot }) {
  return <section className="workspace-view"><div className="view-intro"><div><span className="eyebrow">Automation roadmap</span><h1>Build leverage. Attach controls.</h1><p>Prioritized scenarios combine volume, handling time, implementation effort, confidence, and explicit human safeguards.</p></div></div><div className="roadmap-columns">{(["Now", "Next", "Later"] as const).map((lane) => <section className="roadmap-lane" key={lane}><div className="lane-heading"><strong>{lane}</strong><span>{snapshot.roadmap.filter((item) => item.lane === lane).length}</span></div>{snapshot.roadmap.filter((item) => item.lane === lane).map((item) => <article className="roadmap-card" key={item.id}><div><span>{item.workflow}</span><b>{item.confidence}</b></div><h3>{item.title}</h3><dl><div><dt>Capacity</dt><dd>{formatNumber(item.modeledMonthlyHours,1)} h/mo</dd></div><div><dt>Impact</dt><dd>{item.impact}/5</dd></div><div><dt>Effort</dt><dd>{item.effort}/5</dd></div></dl><p><ShieldCheck size={14} />{item.control}</p></article>)}</section>)}</div></section>;
}

function GovernanceView({ snapshot }: { snapshot: SimulationSnapshot }) {
  return <section className="workspace-view"><div className="view-intro"><div><span className="eyebrow">Governance</span><h1>Evidence over assurances.</h1><p>Every integration choice, exception, fallback, and action leaves a record that can be reviewed.</p></div></div><section className="governance-grid"><article className="surface"><div className="section-heading"><div><span className="eyebrow">Tooling strategy</span><h2>Vendor and approach scorecard</h2></div><CircleDollarSign size={18} /></div><div className="vendor-list">{[...snapshot.vendors].sort((a,b)=>b.weightedScore-a.weightedScore).map((vendor,index)=><div className="vendor-row" key={vendor.vendor}><span>0{index+1}</span><div><strong>{vendor.vendor}</strong><small>{vendor.approach}</small><p>{vendor.recommendation}</p></div><b>{vendor.weightedScore}</b></div>)}</div><p className="method-note">Reliability 35% · security 30% · implementation 20% · cost 15%.</p></article><article className="surface"><div className="section-heading"><div><span className="eyebrow">Traceability</span><h2>PHI-safe audit events</h2></div><ShieldCheck size={18} /></div><div className="audit-list">{snapshot.auditEvents.slice(0,12).map((event)=><div className="audit-row" key={event.id}><span className={`audit-dot ${event.action.toLowerCase()}`} /><div><strong>{event.action.replaceAll("_"," ")}</strong><small>{event.workflowRunId} · {event.patientHash}</small><p>{event.detail}</p></div><time>{new Date(event.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time></div>)}</div></article></section></section>;
}
