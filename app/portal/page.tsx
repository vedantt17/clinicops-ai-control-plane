"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";

export default function SyntheticPortal() {
  const [caseId, setCaseId] = useState("SYN-CLM-1042");
  const [searched, setSearched] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearched(true);
  }

  return (
    <main className="portal-shell">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Control plane</Link>
      <section className="portal-panel" aria-labelledby="portal-title">
        <div className="portal-brand">SYNTHETIC PAYER PORTAL</div>
        <h1 id="portal-title">Coverage status lookup</h1>
        <p>This sandbox contains no patient data. It exists only to test last-mile browser automation.</p>
        <form onSubmit={submit}>
          <label htmlFor="case-id">Synthetic case ID</label>
          <div className="portal-search">
            <input id="case-id" value={caseId} onChange={(event) => { setCaseId(event.target.value); setSearched(false); }} />
            <button type="submit"><Search size={17} /> Look up</button>
          </div>
        </form>
        {searched && (
          <div className="portal-result" role="status">
            <CheckCircle2 size={20} />
            <div><strong>Coverage active</strong><span>{caseId} verified through 2026-12-31</span></div>
          </div>
        )}
      </section>
    </main>
  );
}
