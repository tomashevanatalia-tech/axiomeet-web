import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  AlertCircle, Building2, CheckCircle2, Clock, CreditCard,
  Mail, Receipt, RefreshCw, Shield,
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2900,
    hours: 20,
    zoom: 1,
    description: 'Для небольшой команды',
    features: ['Транскрипция и протоколы', 'Личный кабинет', 'Поддержка по email'],
  },
  {
    id: 'business',
    backendIds: ['business', 'pro'],
    name: 'Business',
    price: 7900,
    hours: 100,
    zoom: 3,
    description: 'Для растущей компании',
    features: ['Приоритетная обработка', 'Telegram-уведомления', 'Приоритетная поддержка'],
    popular: true,
  },
];

const STATUS_LABELS = {
  pending: 'Ожидает',
  succeeded: 'Оплачен',
  failed: 'Отклонён',
  expired: 'Истёк',
  refunded: 'Возвращён',
};

function formatPlan(plan) {
  if (plan === 'pro' || plan === 'business') return 'Business';
  if (plan === 'starter') return 'Starter';
  return 'Trial';
}

function formatPaymentAmount(payment) {
  if (payment.amount_rub != null) return `${Number(payment.amount_rub).toLocaleString('ru-RU')} ₽`;
  if (payment.amount_cents != null && payment.currency === 'RUB') return `${(payment.amount_cents / 100).toLocaleString('ru-RU')} ₽`;
  if (payment.amount_usd != null) return `$${Number(payment.amount_usd).toFixed(2)}`;
  return '—';
}

export default function BillingPage() {
  const [usage, setUsage] = useState(null);
  const [balance, setBalance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usageData, balanceData, historyData] = await Promise.all([
        api.getUsage(),
        api.get('/api/v1/client/payments/balance').catch(() => null),
        api.get('/api/v1/client/payments/history?per_page=50').catch(() => ({ payments: [] })),
      ]);
      setUsage(usageData);
      setBalance(balanceData);
      setPayments(historyData?.payments || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить тариф');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const requestInvoice = (plan) => {
    const account = balance?.organization || '';
    const subject = encodeURIComponent(`Счёт на тариф AxioMeet ${plan.name}`);
    const body = encodeURIComponent(
      `Здравствуйте!\n\nПрошу выставить счёт для компании/ИП на тариф ${plan.name} — ${plan.price.toLocaleString('ru-RU')} ₽ за 30 дней.\nОрганизация в AxioMeet: ${account || 'укажу в ответном письме'}.\n\nРеквизиты плательщика:\nНазвание:\nИНН:\nКПП (если есть):\nEmail для счёта:`,
    );
    window.location.href = `mailto:tomasheva.natalia@yandex.ru?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return <div className="dash-loading"><div className="spinner spinner-lg" /><p>Загрузка тарифа…</p></div>;
  }

  const currentPlan = usage?.plan || balance?.plan || 'free';
  const hoursUsed = Number(usage?.hours_used || 0);
  const hoursLimit = Number(usage?.hours_limit ?? 3);
  const hoursRemaining = usage?.hours_remaining ?? Math.max(0, hoursLimit - hoursUsed);
  const trialExpired = usage?.trial_status === 'expired';

  return (
    <div className="platform-page">
      <PageHeader
        title="Тариф и оплата"
        subtitle="Цены в рублях, без автоматических списаний"
        breadcrumbs={[{ label: 'Основное' }, { label: 'Тариф и оплата' }]}
      >
        <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Обновить</button>
      </PageHeader>

      {error && <div className="form-error" style={{ marginBottom: 16 }}><AlertCircle size={14} /> {error}</div>}

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,.07), rgba(6,182,212,.04))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 5 }}>Текущий тариф</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Shield size={22} style={{ color: 'var(--primary-500)' }} />
              <strong style={{ fontSize: 26 }}>{formatPlan(currentPlan)}</strong>
            </div>
          </div>
          <div style={{ minWidth: 210 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
              <span>Использовано</span><strong>{hoursUsed.toFixed(1)} из {hoursLimit < 0 ? '∞' : hoursLimit} ч</strong>
            </div>
            {hoursLimit > 0 && <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (hoursUsed / hoursLimit) * 100)}%`, background: 'var(--primary-500)' }} /></div>}
            <div style={{ color: trialExpired ? 'var(--error-text)' : 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              {trialExpired ? 'Пробный период завершён' : `Осталось ${Number(hoursRemaining).toFixed(1)} ч`}
              {usage?.trial_ends_at ? ` · до ${new Date(usage.trial_ends_at).toLocaleDateString('ru-RU')}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id || plan.backendIds?.includes(currentPlan);
          return (
            <div key={plan.id} className="card" style={{ borderColor: plan.popular ? 'var(--primary-400)' : undefined, position: 'relative' }}>
              {plan.popular && <span className="badge badge-info" style={{ position: 'absolute', top: 14, right: 14 }}>Популярный</span>}
              <h3 style={{ fontSize: 22, marginBottom: 3 }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{plan.description}</p>
              <div style={{ margin: '18px 0' }}><strong style={{ fontSize: 30 }}>{plan.price.toLocaleString('ru-RU')} ₽</strong><span style={{ color: 'var(--text-muted)' }}> / 30 дней</span></div>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', minHeight: 142 }}>
                <li>До {plan.hours} часов записей</li>
                <li>{plan.zoom === 1 ? '1 подключение' : `До ${plan.zoom} подключений`} Zoom</li>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              {isCurrent ? (
                <button className="btn btn-secondary" disabled><CheckCircle2 size={16} /> Текущий тариф</button>
              ) : (
                <button className="btn btn-primary" onClick={() => requestInvoice(plan)}><Mail size={16} /> Запросить счёт</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title"><CreditCard size={16} /> Способы оплаты</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ padding: 15, background: 'var(--bg-content)', borderRadius: 'var(--radius-md)' }}>
            <Building2 size={20} style={{ color: 'var(--primary-500)', marginBottom: 8 }} />
            <strong style={{ display: 'block' }}>Счёт для компании или ИП</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Доступно сейчас. Тариф включим после поступления оплаты.</span>
          </div>
          <div style={{ padding: 15, background: 'var(--bg-content)', borderRadius: 'var(--radius-md)' }}>
            <CreditCard size={20} style={{ color: 'var(--primary-500)', marginBottom: 8 }} />
            <strong style={{ display: 'block' }}>Банковская карта и СБП</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Появятся после подключения интернет-эквайринга. Оплата только в рублях, с электронным чеком.</span>
          </div>
        </div>
        <p style={{ marginTop: 14, fontSize: 13 }}><a href="https://axiomeet.ru/payment" target="_blank" rel="noopener noreferrer">Условия оплаты, оказания и возврата</a> · <a href="https://axiomeet.ru/oferta" target="_blank" rel="noopener noreferrer">Публичная оферта</a></p>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title"><Receipt size={16} /> История платежей</h3><span className="badge badge-info">{payments.length}</span></div>
        {payments.length === 0 ? (
          <EmptyState icon="🧾" title="Платежей пока нет" description="После оплаты здесь появятся сумма, способ и статус" />
        ) : (
          <div className="table-wrapper"><table className="table"><thead><tr><th>Дата</th><th>Сумма</th><th>Способ</th><th>Статус</th></tr></thead><tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.created_at ? new Date(payment.created_at).toLocaleString('ru-RU') : '—'}</td>
                <td style={{ fontWeight: 700 }}>{formatPaymentAmount(payment)}</td>
                <td>{payment.method || payment.provider || '—'}</td>
                <td>{STATUS_LABELS[payment.status] || payment.status || '—'}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}><Clock size={13} /> Платёж не продлевается автоматически без отдельного согласия.</div>
    </div>
  );
}
