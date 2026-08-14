'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  filterBlueprintTemplates,
  getBlueprintIndustries,
  getBlueprintOutcomes,
} from '@/lib/blueprints';

export default function BlueprintManager({ instances, canManage }: { instances: Array<{ id: string; template_key: string; name: string; status: string; configuration: Record<string, unknown>; created_at: string }>; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const industries = useMemo(() => getBlueprintIndustries(), []);
  const outcomes = useMemo(() => getBlueprintOutcomes(), []);

  const templates = useMemo(
    () =>
      filterBlueprintTemplates({
        search,
        industry: industryFilter || undefined,
        outcome: outcomeFilter || undefined,
      }),
    [search, industryFilter, outcomeFilter]
  );

  const isFiltered = Boolean(search.trim() || industryFilter || outcomeFilter);
  const clearFilters = () => {
    setSearch('');
    setIndustryFilter('');
    setOutcomeFilter('');
  };

  async function create(templateKey: string) {
    setBusy(templateKey);
    const response = await fetch('/api/blueprints', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ templateKey }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return window.alert(body.error || 'Could not create the blueprint.');
    router.refresh();
  }
  async function setStatus(id: string, status: string) {
    setBusy(id);
    const response = await fetch('/api/blueprints', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return window.alert(body.error || 'Could not update the blueprint.');
    router.refresh();
  }
  return (
    <div className="stack">
      <div className="card">
        <div className="sectionhead">
          <div>
            <div className="eyebrow">Template discovery</div>
            <h2>Growth blueprint library</h2>
            <p className="muted">Search by name or outcome and filter by industry or expected result.</p>
          </div>
          <div className="actions">
            <button className="btn secondary" disabled={!isFiltered} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
        <section className="libraryfilters">
          <input
            aria-label="Search growth blueprints"
            className="input"
            name="search"
            placeholder="Search by name or outcome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter by industry"
            className="input"
            name="industry"
            value={industryFilter}
            onChange={(event) => setIndustryFilter(event.target.value)}
          >
            <option value="">All industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          <select aria-label="Filter by outcome" className="input" name="outcome" value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)}>
            <option value="">All outcomes</option>
            {outcomes.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </section>
      </div>
      <section className="blueprints">
        {templates.map((template) => (
          <article className="card blueprint" key={template.key}>
            <span className="pill">{template.industry}</span>
            <h2>{template.name}</h2>
            <strong>{template.outcome}</strong>
            <ul>{template.items.map((item) => <li key={item}>{item}</li>)}</ul>
            {canManage && (
              <button className="btn" disabled={Boolean(busy)} onClick={() => create(template.key)}>
                {busy === template.key ? 'Creating...' : 'Use blueprint'}
              </button>
            )}
          </article>
        ))}
        {!templates.length ? <p className="muted">No blueprints match your filters.</p> : null}
      </section>
      <section className="card table-card">
        <div className="sectionhead">
          <div>
            <h2>Workspace playbooks</h2>
            <p className="muted">Each instance is independently configurable and scoped to this workspace.</p>
          </div>
        </div>
        {instances.length ? (
          <div className="data-table">
            <div className="data-row data-head">
              <span>Name</span>
              <span>Template</span>
              <span>Status</span>
              <span>Control</span>
            </div>
            {instances.map((instance) => (
              <div className="data-row" key={instance.id}>
                <b>{instance.name}</b>
                <span>{instance.template_key.replaceAll('-', ' ')}</span>
                <span className={`status ${instance.status}`}>{instance.status}</span>
                <span>
                  {canManage && (
                    <select
                      className="input compact"
                      value={instance.status}
                      disabled={busy === instance.id}
                      onChange={(event) => setStatus(instance.id, event.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No blueprint instances yet. Choose a template above to create one.</p>
        )}
      </section>
    </div>
  );
}
