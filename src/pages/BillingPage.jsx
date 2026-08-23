import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  AlertCircle, ArrowUpRight, Building2, CheckCircle2, Clock, Copy,
  CreditCard, ExternalLink, Loader2, Mail, Receipt, RefreshCw,
  Shield, Wallet, Zap,
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

const CRYPTO_OPTIONS = [
  { code: 'USDT_TRC20', label: 'USDT', network: 'TRC-20 · Tron', icon: '₮', popular: true },
  { code: 'USDT_TON', label: 'USDT', network: 'TON', icon: '₮' },
  { code: 'USDT_BSC', label: 'USDT', network: 'BEP-20 · BNB Chain', icon: '₮' },
  { code: 'BTC', label: 'Bitcoin', network: 'Bitcoin', icon: '₿' },
  { code: 'ETH', label: 'Ethereum', network: 'Ethereum', icon: 'Ξ' },
  { code: 'TON', label: 'Toncoin', network: 'TON', icon: '◆' },
  { code: 'SOL', label: 'Solana', network: 'Solana', icon: '◎' },
  { code: 'LTC', label: 'Litecoin', network: 'Litecoin', icon: 'Ł' },
];

const AMOUNT_PRESETS = [10, 25, 50, 100, 250];

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

function formatPaymentMethod(payment) {
  const method = payment.method || '';
  if (method.startsWith('crypto_')) {
    return `Криптовалюта · ${method.slice('crypto_'.length).replaceAll('_', ' ')}`;
  }
  if (method === 'crypto' || payment.provider === 'cryptocloud') return 'Криптовалюта';
  return method || payment.provider || '—';
}

function CryptoTopupPanel({ onClose }) {
  const [amount, setAmount] = useState(25);
  const [mode, setMode] = useState('redirect');
  const [cryptocurrency, setCryptocurrency] = useState('USDT_TRC20');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [topupError, setTopupError] = useState('');
  const [copied, setCopied] = useState(false);

  const createPayment = async () => {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 5) {
      setTopupError('Минимальная сумма пополнения — $5.');
      return;
    }

    setSubmitting(true);
    setTopupError('');
    setResult(null);
    try {
      const payload = { amount: normalizedAmount, currency: 'USD' };
      if (mode === 'h2h') payload.cryptocurrency = cryptocurrency;
      setResult(await api.post('/api/v1/client/payments/topup', payload));
    } catch (err) {
      setTopupError(err.message || 'Не удалось создать криптовалютный счёт.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setTopupError('Не удалось скопировать адрес. Выделите и скопируйте его вручную.');
    }
  };

  const startAgain = () => {
    setResult(null);
    setTopupError('');
  };

  return (
    <div className="card" style={{ marginBottom: 24, borderColor: 'var(--primary-300)' }}>
      <div className="card-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="card-title"><Wallet size={17} /> Оплата криптовалютой</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>
            Пополните баланс через CryptoCloud. После подтверждения сети платёж зачислится автоматически.
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Закрыть</button>
      </div>

      {topupError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} /> {topupError}
        </div>
      )}

      {result ? (
        <div>
          {result.mode === 'redirect' && result.pay_url ? (
            <div style={{ padding: '18px 0 4px', textAlign: 'center' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--success)', marginBottom: 10 }} />
              <h3 style={{ marginBottom: 7 }}>Счёт создан</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                На странице CryptoCloud можно выбрать доступную криптовалюту и сеть.
              </p>
              <a href={result.pay_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <ExternalLink size={16} /> Перейти к оплате
              </a>
              <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={startAgain}>Создать другой счёт</button>
            </div>
          ) : result.mode === 'h2h' && result.address ? (
            <div>
              <div style={{ padding: 16, background: 'var(--info-bg)', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--info-text)', marginBottom: 14 }}>
                  Переведите точную сумму только в указанной сети. Перевод через другую сеть может быть утрачен.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>К оплате</div>
                    <strong style={{ fontSize: 22 }}>{result.amount_crypto} {result.cryptocurrency}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5 }}>{result.network || 'Криптовалютная сеть'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Адрес кошелька</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ flex: 1, padding: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all', fontSize: 12 }}>
                        {result.address}
                      </code>
                      <button className="btn btn-secondary btn-sm" onClick={copyAddress} title="Скопировать адрес">
                        {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                {result.expiry_date && (
                  <div style={{ color: 'var(--warning-text)', fontSize: 12, marginTop: 13 }}>
                    <Clock size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                    Оплатить до {new Date(result.expiry_date).toLocaleString('ru-RU')}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={startAgain}>← Создать другой счёт</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 18 }}>
              <CheckCircle2 size={44} style={{ color: 'var(--success)', marginBottom: 10 }} />
              <p>Счёт создан. Статус платежа появится в истории ниже.</p>
              <button className="btn btn-ghost btn-sm" onClick={startAgain}>Создать другой счёт</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Сумма пополнения, USD</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 9 }}>
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  className={`btn btn-sm ${Number(amount) === preset ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAmount(preset)}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <input
              className="form-input"
              type="number"
              min="5"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              style={{ maxWidth: 210 }}
              aria-label="Сумма пополнения в долларах"
            />
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5 }}>Минимум $5</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Как получить реквизиты</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button className={`btn btn-sm ${mode === 'redirect' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('redirect')}>
                <ExternalLink size={14} /> Выбрать валюту на странице оплаты
              </button>
              <button className={`btn btn-sm ${mode === 'h2h' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('h2h')}>
                <Wallet size={14} /> Получить адрес в кабинете
              </button>
            </div>
          </div>

          {mode === 'h2h' && (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Криптовалюта и сеть</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                {CRYPTO_OPTIONS.map((option) => {
                  const selected = cryptocurrency === option.code;
                  return (
                    <button
                      key={option.code}
                      className="card"
                      onClick={() => setCryptocurrency(option.code)}
                      aria-pressed={selected}
                      style={{
                        padding: '11px 13px', textAlign: 'left', cursor: 'pointer', position: 'relative',
                        borderColor: selected ? 'var(--primary-500)' : undefined,
                        background: selected ? 'var(--primary-50)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 20, width: 22, textAlign: 'center' }}>{option.icon}</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: 14 }}>{option.label}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{option.network}</span>
                        </div>
                      </div>
                      {option.popular && <span className="badge badge-success" style={{ position: 'absolute', top: 6, right: 6, fontSize: 9 }}>Популярный</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={createPayment} disabled={submitting || Number(amount) < 5}>
            {submitting ? <Loader2 size={16} className="spinning" /> : <Zap size={16} />}
            Создать счёт на ${Number(amount) || 0}
          </button>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [usage, setUsage] = useState(null);
  const [balance, setBalance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCryptoTopup, setShowCryptoTopup] = useState(false);

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
          <div style={{ padding: 15, background: 'var(--bg-content)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)' }}>
            <Wallet size={20} style={{ color: 'var(--primary-500)', marginBottom: 8 }} />
            <strong style={{ display: 'block' }}>Криптовалюта</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', marginBottom: 11 }}>
              Доступно сейчас: USDT, BTC, ETH, TON, SOL и LTC. Баланс зачисляется автоматически.
            </span>
            {balance?.balance_usd != null && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Текущий баланс: <strong style={{ color: 'var(--text-primary)' }}>${Number(balance.balance_usd).toFixed(2)}</strong>
              </div>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCryptoTopup(true)}>
              <ArrowUpRight size={15} /> Оплатить криптовалютой
            </button>
          </div>
        </div>
        <p style={{ marginTop: 14, fontSize: 13 }}><a href="https://axiomeet.ru/payment" target="_blank" rel="noopener noreferrer">Условия оплаты, оказания и возврата</a> · <a href="https://axiomeet.ru/oferta" target="_blank" rel="noopener noreferrer">Публичная оферта</a></p>
      </div>

      {showCryptoTopup && <CryptoTopupPanel onClose={() => setShowCryptoTopup(false)} />}

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
                <td>{formatPaymentMethod(payment)}</td>
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
