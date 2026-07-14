import { useI18n } from "../i18n";

// Visible FAQ that mirrors the FAQPage JSON-LD in index.html. Answer-first
// phrasing with concrete numbers, which helps both readers and AI search.
const KEYS = ["1", "2", "3", "4", "5"];

export function FaqSection() {
  const { t } = useI18n();
  return (
    <section className="panel faq" aria-labelledby="faq-title">
      <div className="panel-head">
        <span className="panel-index">?</span>
        <h2 className="panel-title" id="faq-title">
          {t("faq.title")}
        </h2>
      </div>
      <div className="faq-list">
        {KEYS.map((k) => (
          <div className="faq-item" key={k}>
            <h3 className="faq-q">{t(`faq.q${k}`)}</h3>
            <p className="faq-a">{t(`faq.a${k}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
