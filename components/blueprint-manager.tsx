'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n-provider';
import {
  getBlueprintTemplate,
  type GrowthBlueprintTemplate,
  filterBlueprintTemplates,
  getBlueprintIndustries,
  getBlueprintOutcomes,
} from '@/lib/blueprints';

type BlueprintStatus = 'draft' | 'active' | 'paused' | 'completed';

type BlueprintInstance = {
  id: string;
  template_key: string;
  name: string;
  status: string;
  configuration: Record<string, unknown>;
  created_at: string;
};

type BlueprintManagerProps = {
  instances: BlueprintInstance[];
  canManage: boolean;
};

const blueprintStatuses: BlueprintStatus[] = ['draft', 'active', 'paused', 'completed'];

function normalizeStatus(value: string): BlueprintStatus {
  return blueprintStatuses.includes(value as BlueprintStatus) ? (value as BlueprintStatus) : 'draft';
}

function parseChecklist(configuration: Record<string, unknown>): string[] {
  const raw = configuration?.checklist;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function toChecklistLines(checklist: string[]) {
  return checklist.join('\n');
}

function fromChecklistLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function pickTemplate(templateKey: string): GrowthBlueprintTemplate | undefined {
  return getBlueprintTemplate(templateKey);
}

function pickStatusLabel(t: (key: string) => string, value: string) {
  return t(`blueprint.status.${normalizeStatus(value)}`);
}

export default function BlueprintManager({ instances, canManage }: BlueprintManagerProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingStatus, setEditingStatus] = useState<BlueprintStatus>('draft');
  const [editingChecklist, setEditingChecklist] = useState('');

  const playbooksRef = useRef<HTMLElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

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

  const hasMessage = message || errorMessage;

  const clearFilters = () => {
    setSearch('');
    setIndustryFilter('');
    setOutcomeFilter('');
  };

  function clearToast() {
    if (message) setMessage('');
    if (errorMessage) setErrorMessage('');
  }

  async function create(templateKey: string, templateName: string) {
    setBusy(templateKey);
    clearToast();

    try {
      const response = await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(body.error || t('blueprint.createFailed'));
      } else {
        setMessage(t('blueprint.createSuccess').replace('{name}', templateName));
        playbooksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        playbooksRef.current?.focus();
        router.refresh();
      }
    } finally {
      setBusy('');
    }
  }

  async function setStatus(instanceId: string, status: BlueprintStatus) {
    setBusy(instanceId);
    clearToast();

    try {
      const response = await fetch('/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: instanceId, status }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(body.error || t('blueprint.saveFailed'));
      } else {
        setMessage(t('blueprint.statusUpdated'));
        router.refresh();
      }
    } finally {
      setBusy('');
    }
  }

  function beginEdit(instance: BlueprintInstance) {
    const checklist = parseChecklist(instance.configuration);
    setEditingId(instance.id);
    setEditingName(instance.name);
    setEditingStatus(normalizeStatus(instance.status));
    setEditingChecklist(toChecklistLines(checklist));
    setMessage('');
    setErrorMessage('');
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editorRef.current?.querySelector<HTMLElement>('input')?.focus();
    }, 0);
  }

  function cancelEdit() {
    setEditingId('');
    setEditingName('');
    setEditingStatus('draft');
    setEditingChecklist('');
  }

  async function save(instance: BlueprintInstance) {
    setBusy(`${instance.id}:save`);
    clearToast();

    const payload = {
      id: instance.id,
      name: editingName.trim() || instance.name,
      status: editingStatus,
      checklist: fromChecklistLines(editingChecklist),
    };

    try {
      const response = await fetch('/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(body.error || t('blueprint.saveFailed'));
      } else {
        setMessage(t('blueprint.saved'));
        cancelEdit();
        router.refresh();
      }
    } finally {
      setBusy('');
    }
  }

  async function remove(instance: BlueprintInstance, event: FormEvent) {
    event.preventDefault();

    if (!window.confirm(t('blueprint.deleteConfirmation'))) return;

    setBusy(`${instance.id}:delete`);
    clearToast();

    try {
      const response = await fetch('/api/blueprints', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: instance.id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(body.error || t('blueprint.deleteFailed'));
      } else {
        setMessage(t('blueprint.deleted'));
        if (editingId === instance.id) {
          cancelEdit();
        }
        router.refresh();
      }
    } finally {
      setBusy('');
    }
  }

  const instanceTemplates = useMemo(
    () =>
      new Map<string, GrowthBlueprintTemplate>(
        instances
          .map((instance) => pickTemplate(instance.template_key))
          .filter((template): template is GrowthBlueprintTemplate => Boolean(template))
          .map((template) => [template.key, template])
      ),
    [instances]
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="sectionhead">
          <div>
            <div className="eyebrow">{t('blueprint.librarySection')}</div>
            <h2>{t('blueprint.title')}</h2>
            <p className="muted">{t('blueprint.subtitle')}</p>
          </div>
          <div className="actions">
            <button className="btn secondary" disabled={!isFiltered} onClick={clearFilters} type="button">
              {t('blueprint.clearFilters')}
            </button>
          </div>
        </div>

        <section className="libraryfilters">
          <input
            aria-label={t('blueprint.searchLabel')}
            className="input"
            name="search"
            placeholder={t('blueprint.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label={t('blueprint.filterIndustryLabel')}
            className="input"
            name="industry"
            value={industryFilter}
            onChange={(event) => setIndustryFilter(event.target.value)}
          >
            <option value="">{t('blueprint.allIndustries')}</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          <select
            aria-label={t('blueprint.filterOutcomeLabel')}
            className="input"
            name="outcome"
            value={outcomeFilter}
            onChange={(event) => setOutcomeFilter(event.target.value)}
          >
            <option value="">{t('blueprint.allOutcomes')}</option>
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
              <button className="btn" disabled={Boolean(busy)} onClick={() => create(template.key, template.name)}>
                {busy === template.key ? t('common.creating') : t('blueprint.createLabel')}
              </button>
            )}
          </article>
        ))}

        {!templates.length ? <p className="muted">{t('blueprint.noBlueprints')}</p> : null}
      </section>

      <section className="card table-card" ref={playbooksRef} tabIndex={-1}>
        <div className="sectionhead">
          <div>
            <h2>{t('blueprint.workspacePlaybooks')}</h2>
            <p className="muted">{t('blueprint.playbooksDescription')}</p>
          </div>
        </div>

        {hasMessage ? <div className={`notice ${errorMessage ? 'notice-error' : 'success'}`}>{errorMessage || message}</div> : null}

        {instances.length ? (
          <div className="data-table">
            <div className="data-row data-head">
              <span>{t('blueprint.instanceName')}</span>
              <span>{t('blueprint.instanceTemplate')}</span>
              <span>{t('blueprint.instanceStatus')}</span>
              <span>{t('blueprint.instanceActions')}</span>
            </div>
            {instances.map((instance) => {
              const template = instanceTemplates.get(instance.template_key);
              const configuration = parseChecklist(instance.configuration);
              const isEditing = editingId === instance.id;
              const currentStatus = normalizeStatus(instance.status);

              return (
                <div className="blueprint-row-wrap" key={instance.id}>
                  <div className="data-row">
                    <span>
                      <b>{instance.name}</b>
                      <small>
                        {t('blueprint.createdOn')} {new Date(instance.created_at).toLocaleDateString()}
                      </small>
                    </span>
                    <span>{template ? template.name : instance.template_key}</span>
                    <span>
                      <span className={`status ${currentStatus}`}>{pickStatusLabel(t, currentStatus)}</span>
                    </span>
                    <span className="rowactions">
                      <select
                        className="input compact"
                        value={currentStatus}
                        disabled={!canManage || busy === instance.id}
                        onChange={(event) => setStatus(instance.id, event.target.value as BlueprintStatus)}
                      >
                        {blueprintStatuses.map((status) => (
                          <option key={status} value={status}>
                            {pickStatusLabel(t, status)}
                          </option>
                        ))}
                      </select>
                      {canManage ? (
                        <>
                          <button className="mini" onClick={() => beginEdit(instance)} disabled={busy !== ''} type="button">
                            {t('blueprint.configure')}
                          </button>
                          <form onSubmit={(event) => remove(instance, event)} style={{ margin: 0 }}>
                            <button className="mini danger" type="submit" disabled={busy !== ''}>
                              {t('blueprint.delete')}
                            </button>
                          </form>
                        </>
                      ) : null}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="blueprint-editor-row" ref={editorRef}>
                      <div className="card editcard">
                        <div className="sectionhead">
                          <div>
                            <h3>{t('blueprint.configureHeading')}</h3>
                            <p className="muted">{t('blueprint.configureMessage').replace('{name}', instance.name)}</p>
                          </div>
                        </div>

                        <div className="formgrid">
                          <label className="field">
                            <span>{t('blueprint.blueprintName')}</span>
                            <input
                              className="input"
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              aria-label={t('blueprint.blueprintName')}
                              disabled={busy === `${instance.id}:save`}
                            />
                          </label>

                          <label className="field">
                            <span>{t('blueprint.statusLabel')}</span>
                            <select
                              className="input"
                              value={editingStatus}
                              onChange={(event) => setEditingStatus(event.target.value as BlueprintStatus)}
                              aria-label={t('blueprint.statusLabel')}
                              disabled={busy === `${instance.id}:save`}
                            >
                              {blueprintStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {pickStatusLabel(t, status)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="template-context">
                          <p>
                            <strong>{t('blueprint.templateLabel')}</strong> {template?.name ?? instance.template_key}
                          </p>
                          <p>
                            <strong>{t('blueprint.outcomeLabel')}</strong> {template?.outcome ?? t('blueprint.unknownTemplate')}
                          </p>
                          <p>
                            <strong>{t('blueprint.industryLabel')}</strong> {template?.industry ?? t('blueprint.unknownTemplate')}
                          </p>
                          <div>
                            <strong>{t('blueprint.recommendationLabel')}</strong>
                            <ul>
                              {(template?.items ?? configuration).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <label className="field full">
                          <span>{t('blueprint.checklistLabel')}</span>
                          <textarea
                            className="input"
                            value={editingChecklist}
                            onChange={(event) => setEditingChecklist(event.target.value)}
                            rows={6}
                            aria-label={t('blueprint.checklistLabel')}
                            disabled={busy === `${instance.id}:save`}
                            placeholder={t('blueprint.checklistPlaceholder')}
                          />
                        </label>

                        <div className="actions">
                          <button className="btn" onClick={() => save(instance)} disabled={busy === `${instance.id}:save`}>
                            {busy === `${instance.id}:save` ? t('common.saving') : t('blueprint.savePlaybook')}
                          </button>
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy === `${instance.id}:save`}
                          >
                            {t('blueprint.cancel')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">{t('blueprint.notConfigured')}</p>
        )}
      </section>
    </div>
  );
}
