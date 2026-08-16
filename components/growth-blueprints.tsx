import Link from 'next/link';
import { useI18n } from '@/components/i18n-provider';
import { getBlueprintTemplate } from '@/lib/blueprints';

const templateKeys = ['restaurant-revenue-loop', 'local-reputation-engine', 'social-conversion-hub'];

export default function GrowthBlueprints() {
  const { t } = useI18n();

  return (
    <section className="module-section">
      <div className="sectionhead">
        <div>
          <div className="eyebrow">{t('blueprints.premiumGrowthSystems')}</div>
          <h2>{t('blueprints.title')}</h2>
          <p className="muted">{t('blueprints.subtitle')}</p>
        </div>
        <Link className="textlink" href="/dashboard/blueprints">
          {t('blueprints.viewAll')}
        </Link>
      </div>
      <div className="blueprints">
        {templateKeys.map((templateKey) => {
          const template = getBlueprintTemplate(templateKey);
          if (!template) return null;

          return (
            <article className="card blueprint" key={template.key}>
              <span className="pill">{template.industry}</span>
              <h3>{template.name}</h3>
              <strong>{template.outcome}</strong>
              <p className="muted">{template.description}</p>
              <ul>{template.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link className="btn secondary" href="/dashboard/blueprints">
                {t('blueprints.configureBlueprint')}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
