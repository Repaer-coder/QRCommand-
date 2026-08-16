import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import AIAssistant from '@/components/ai-assistant';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function AIPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();

  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'ai.assistant')) redirect('/dashboard/billing');

  const [{ data: insights }, { data: recommendations }, { data: actions }] = await Promise.all([
    supabase
      .from('ai_insights')
      .select('id,title,summary,severity,evidence,created_at')
      .eq('organization_id', context.organization.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('ai_recommendations')
      .select('id,title,rationale,confidence,status,supporting_metrics,created_at')
      .eq('organization_id', context.organization.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('ai_action_runs')
      .select('id,action_type,action_payload,status,created_at')
      .eq('organization_id', context.organization.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  return (
    <div className="shell">
      <DashboardSidebar
        active="ai"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.ai.badge')}</div>
            <h1>{t('dashboard.ai.header')}</h1>
            <p className="muted">{t('dashboard.ai.reportDescription')}</p>
          </div>
          <span className="pill">{t('dashboard.ai.serverOnly')}</span>
        </div>
        <AIAssistant actions={actions ?? []} canApprove={hasWorkspaceRole(context.organization.role, 'admin')} />

        <section className="insight-grid">
          {insights?.map((insight) => (
            <article className="card insight-card" key={insight.id}>
              <span className={`status ${insight.severity}`}>{insight.severity}</span>
              <h2>{insight.title}</h2>
              <p>{insight.summary}</p>
              <ul>{Array.isArray(insight.evidence) && insight.evidence.map((item: string) => <li key={item}>{item}</li>)}</ul>
              <small>{new Date(insight.created_at).toLocaleString()}</small>
            </article>
          ))}
        </section>

        {recommendations?.length ? (
          <section className="card table-card">
            <h2>{t('dashboard.ai.proposedActions')}</h2>
            <div className="data-table">
              <div className="data-row data-head">
                <span>{t('dashboard.ai.tableRecommendation')}</span>
                <span>{t('dashboard.ai.confidence')}</span>
                <span>{t('dashboard.ai.status')}</span>
                <span>{t('dashboard.ai.created')}</span>
              </div>
              {recommendations.map((recommendation) => (
                <div className="data-row" key={recommendation.id}>
                  <span>
                    <b>{recommendation.title}</b>
                    <small>{recommendation.rationale}</small>
                  </span>
                  <span>{recommendation.confidence}</span>
                  <span className={`status ${recommendation.status}`}>{recommendation.status}</span>
                  <span>{new Date(recommendation.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
