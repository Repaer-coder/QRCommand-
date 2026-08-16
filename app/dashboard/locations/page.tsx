import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard-sidebar';
import LocationActions from '@/components/location-actions';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function LocationsPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t, formatInteger, formatDate } = await getServerI18n();
  if ('error' in context) return null;
  const { data: locations, error } = await supabase.from('locations').select('id,name,address,created_at,qr_codes(id)').eq('organization_id', context.organization.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const canManage = hasWorkspaceRole(context.organization.role, 'manager');
  const canDelete = hasWorkspaceRole(context.organization.role, 'admin');
  return (
    <div className="shell">
      <DashboardSidebar
        active="locations"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.locations.moduleTitle')}</div>
            <h1>{t('dashboard.locations.heading')}</h1>
            <p className="muted">{t('dashboard.locations.description')}</p>
          </div>
          {canManage && (
            <Link href="/dashboard/locations/new" className="btn">
              {t('dashboard.locations.addBtn')}
            </Link>
          )}
        </div>
        {locations?.length ? (
          <section className="location-grid">
            {locations.map((location) => (
              <article className="card location-card" key={location.id}>
                <div className="location-index">{location.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h2>{location.name}</h2>
                  <p className="muted">{location.address || t('dashboard.locations.addressMissing')}</p>
                  <div className="location-meta">
                    <span>
                      {formatInteger(Array.isArray(location.qr_codes) ? location.qr_codes.length : 0)} {t('dashboard.locations.campaignCountLabel')}
                    </span>
                    <span>{t('dashboard.locations.addedPrefix')} {formatDate(location.created_at)}</span>
                  </div>
                </div>
                {canManage && <LocationActions id={location.id} name={location.name} canDelete={canDelete} />}
              </article>
            ))}
          </section>
        ) : (
          <section className="card empty">
            <div className="emptyicon">01</div>
            <h2>{t('dashboard.locations.noTitle')}</h2>
            <p className="muted">{t('dashboard.locations.noDescription')}</p>
            {canManage && (
              <Link className="btn" href="/dashboard/locations/new">
                {t('dashboard.locations.addLocation')}
              </Link>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
