import { useState, useEffect } from 'react';
import api from '../api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₽0',
    period: '/мес',
    hours: 3,
    features: ['3 часа обработки', '1 пользователь', 'Zoom', 'Базовые отчёты'],
    color: 'var(--color-text-muted)',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₽2 990',
    period: '/мес',
    hours: 30,
    features: ['30 часов обработки', '5 пользователей', 'Zoom + Google Meet', 'Яндекс Диск / GDrive', 'Email-поддержка'],
    color: 'var(--color-primary-400)',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₽9 990',
    period: '/мес',
    hours: 100,
    features: ['100 часов обработки', '20 пользователей', 'Все платформы', 'API доступ', 'Приоритетная обработка', 'Telegram-поддержка'],
    color: 'var(--color-accent-400)',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    hours: -1,
    features: ['Безлимитная обработка', 'Безлимит пользователей', 'Dedicated инфраструктура', 'SLA 99.9%', 'On-premise опция', 'Персональный менеджер'],
    color: 'var(--color-warning)',
    popular: false,
  },
];

export default function AdminBillingPage() {
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState('');

  useEffect(() => { loadBilling(); }, []);

  const loadBilling = async () => {
    try {
      const [billingData, invoiceData] = await Promise.all([
        api.get('/api/v1/admin/billing').catch(() => ({})),
        api.get('/api/v1/admin/billing/invoices').catch(() => ({ invoices: [] })),
      ]);
      setBilling(billingData);
      setInvoices(invoiceData.invoices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (planId === 'enterprise') {
      window.open('mailto:sales@axiomeet.io?subject=Enterprise Plan Request', '_blank');
      return;
    }
    setUpgradeLoading(planId);
    try {
      await api.post('/api/v1/admin/billing/upgrade', { plan: planId });
      await loadBilling();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgradeLoading('');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const currentPlan = billing?.plan || 'free';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Тарифы и Биллинг</h1>
        <p className="page-subtitle">Управление подпиской и платежами</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Current Plan Banner */}
      <div className="card" style={{ marginBottom: 32, borderColor: 'var(--color-primary-500)', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Текущий план</div>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>
              {PLANS.find((p) => p.id === currentPlan)?.name || currentPlan.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>Использовано в этом месяце</div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>
              {billing?.hours_used?.toFixed(1) || '0.0'}h / {billing?.hours_limit > 0 ? `${billing?.hours_limit}h` : '∞'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>Следующий платёж</div>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>
              {billing?.next_payment_date ? new Date(billing.next_payment_date).toLocaleDateString('ru-RU') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className="card"
              style={{
                borderColor: plan.popular ? 'var(--color-primary-500)' : isCurrent ? 'var(--color-success)' : undefined,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: 12, right: -30,
                  background: 'var(--color-primary-500)', color: 'white',
                  padding: '2px 40px', fontSize: 'var(--font-xs)', fontWeight: 700,
                  transform: 'rotate(45deg)', letterSpacing: '0.05em',
                }}>
                  Popular
                </div>
              )}

              <div style={{ color: plan.color, fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {plan.name}
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, fontSize: 'var(--font-sm)' }}>
                {plan.features.map((f, idx) => (
                  <li key={idx} style={{ padding: '6px 0', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--color-success)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                  ✅ Текущий план
                </button>
              ) : (
                <button
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgradeLoading === plan.id}
                >
                  {upgradeLoading === plan.id ? <span className="spinner" /> : null}
                  {plan.id === 'enterprise' ? 'Связаться' : 'Перейти'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">История платежей</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-icon">🧾</div>
            <div className="empty-title">Нет платежей</div>
            <div className="empty-desc">История счетов и платежей будет отображаться здесь</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>№ Счёта</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>#{inv.number || inv.id}</td>
                    <td>{inv.date ? new Date(inv.date).toLocaleDateString('ru-RU') : '—'}</td>
                    <td style={{ fontWeight: 600 }}>₽{inv.amount?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                        {inv.status === 'paid' ? 'Оплачен' : inv.status === 'pending' ? 'Ожидает' : inv.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm">📄 Скачать</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
