import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  Wallet, CreditCard, TrendingUp, Clock, Shield, ArrowUpRight,
  RefreshCw, ExternalLink, Copy, CheckCircle2, AlertCircle,
  Loader2, DollarSign, Zap, Receipt, ChevronDown,
} from 'lucide-react';

const CRYPTO_OPTIONS = [
  { code: 'USDT_TRC20', label: 'USDT (TRC-20)', network: 'Tron', icon: '💲', popular: true },
  { code: 'USDT_TON', label: 'USDT (TON)', network: 'TON', icon: '💲' },
  { code: 'USDT_BSC', label: 'USDT (BSC)', network: 'BNB Chain', icon: '💲' },
  { code: 'BTC', label: 'Bitcoin', network: 'Bitcoin', icon: '₿' },
  { code: 'ETH', label: 'Ethereum', network: 'Ethereum', icon: 'Ξ' },
  { code: 'TON', label: 'Toncoin', network: 'TON', icon: '💎' },
  { code: 'SOL', label: 'Solana', network: 'Solana', icon: '◎' },
  { code: 'LTC', label: 'Litecoin', network: 'Litecoin', icon: 'Ł' },
];

const AMOUNT_PRESETS = [10, 25, 50, 100, 250];

const STATUS_LABELS = {
  pending: { label: 'Ожидает', cls: 'badge-warning' },
  succeeded: { label: 'Оплачен', cls: 'badge-success' },
  failed: { label: 'Отклонён', cls: 'badge-error' },
  expired: { label: 'Истёк', cls: 'badge-muted' },
  refunded: { label: 'Возвращён', cls: 'badge-info' },
};

export default function BillingPage() {
  const [balance, setBalance] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top-up state
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(25);
  const [topupCrypto, setTopupCrypto] = useState('');
  const [topupMode, setTopupMode] = useState('redirect'); // redirect or h2h
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupResult, setTopupResult] = useState(null);
  const [copied, setCopied] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceData, expensesData, historyData] = await Promise.all([
        api.get('/api/v1/client/payments/balance').catch(() => null),
        api.get('/api/v1/client/payments/expenses').catch(() => null),
        api.get('/api/v1/client/payments/history?per_page=50').catch(() => ({ payments: [] })),
      ]);
      setBalance(balanceData);
      setExpenses(expensesData);
      setPayments(historyData?.payments || []);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTopup = async () => {
    if (topupAmount < 5) return;
    setTopupLoading(true);
    setTopupResult(null);
    try {
      const body = { amount: topupAmount };
      if (topupMode === 'h2h' && topupCrypto) {
        body.cryptocurrency = topupCrypto;
      }
      const result = await api.post('/api/v1/client/payments/topup', body);
      setTopupResult(result);
    } catch (err) {
      setError(err.message || 'Ошибка создания платежа');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner spinner-lg" />
        <p>Загрузка биллинга...</p>
      </div>
    );
  }

  if (error && !balance) {
    return (
      <div className="dash-error">
        <AlertCircle size={48} strokeWidth={1.5} />
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>
          <RefreshCw size={16} /> Повторить
        </button>
      </div>
    );
  }

  const balanceUsd = balance?.balance_usd || 0;
  const plan = (balance?.plan || 'free').toUpperCase();

  return (
    <div className="platform-page">
      <PageHeader
        title="Биллинг"
        subtitle="Баланс, пополнение и история платежей"
        breadcrumbs={[{ label: 'Основное' }, { label: 'Биллинг' }]}
      >
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Обновить
        </button>
      </PageHeader>

      {error && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Balance Banner ─────────────────────────────────── */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.04))',
        borderColor: 'var(--primary-200)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={14} /> Текущий баланс
            </div>
            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              ${balanceUsd.toFixed(2)}
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`plan-badge plan-${plan.toLowerCase()}`}>
                <Shield size={12} /> {plan}
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {balance?.organization || ''}
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowTopup(!showTopup)}>
            <ArrowUpRight size={16} /> Пополнить баланс
          </button>
        </div>
      </div>

      {/* ── Top-Up Panel ─────────────────────────────────── */}
      {showTopup && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--primary-300)' }}>
          <div className="card-header">
            <h3 className="card-title"><CreditCard size={16} /> Пополнение баланса</h3>
          </div>

          {topupResult ? (
            // ── Payment Result ──
            <div>
              {topupResult.mode === 'redirect' && topupResult.pay_url ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: 12 }} />
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Счёт создан</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                    Перейдите по ссылке для оплаты ${topupResult.amount} через CryptoCloud
                  </p>
                  <a
                    href={topupResult.pay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <ExternalLink size={16} /> Перейти к оплате
                  </a>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setTopupResult(null)}>
                    Создать новый
                  </button>
                </div>
              ) : topupResult.mode === 'h2h' && topupResult.address ? (
                <div style={{ padding: 8 }}>
                  <div style={{
                    background: 'var(--info-bg)', borderRadius: 'var(--radius-md)',
                    padding: 16, marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--info-text)', fontWeight: 600, marginBottom: 12 }}>
                      Переведите точную сумму на адрес:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Сумма</div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>
                          {topupResult.amount_crypto} {topupResult.cryptocurrency}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Адрес ({topupResult.network || topupResult.cryptocurrency})</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <code style={{
                            flex: 1, padding: 10, background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)',
                            wordBreak: 'break-all', border: '1px solid var(--border-color)',
                          }}>
                            {topupResult.address}
                          </code>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopy(topupResult.address, 'addr')}
                          >
                            {copied === 'addr' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      {topupResult.expiry_date && (
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--warning-text)' }}>
                          <Clock size={12} /> Оплатите до: {new Date(topupResult.expiry_date).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTopupResult(null)}>
                    ← Создать новый платёж
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: 12 }} />
                  <p>Платёж создан (ID: {topupResult.payment_id})</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTopupResult(null)}>
                    Создать новый
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ── Top-up Form ──
            <div>
              {/* Amount */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Сумма (USD)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {AMOUNT_PRESETS.map(a => (
                    <button
                      key={a}
                      className={`btn btn-sm ${topupAmount === a ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setTopupAmount(a)}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <input
                  className="form-input" type="number" min="5" step="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  style={{ maxWidth: 200 }}
                />
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: 8 }}>
                  Минимум $5.00
                </span>
              </div>

              {/* Payment Mode */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Способ оплаты</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn btn-sm ${topupMode === 'redirect' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setTopupMode('redirect'); setTopupCrypto(''); }}
                  >
                    <ExternalLink size={14} /> CryptoCloud (выбор на сайте)
                  </button>
                  <button
                    className={`btn btn-sm ${topupMode === 'h2h' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTopupMode('h2h')}
                  >
                    <Wallet size={14} /> Прямой перевод (H2H)
                  </button>
                </div>
              </div>

              {/* Crypto Selector (H2H mode) */}
              {topupMode === 'h2h' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Криптовалюта</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                    {CRYPTO_OPTIONS.map(c => (
                      <button
                        key={c.code}
                        className="card"
                        onClick={() => setTopupCrypto(c.code)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                          borderColor: topupCrypto === c.code ? 'var(--primary-500)' : undefined,
                          background: topupCrypto === c.code ? 'var(--primary-50)' : undefined,
                          transition: 'all var(--transition)', position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{c.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{c.label}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{c.network}</div>
                          </div>
                        </div>
                        {c.popular && (
                          <span style={{
                            position: 'absolute', top: 4, right: 6,
                            fontSize: 9, background: 'var(--success-bg)', color: 'var(--success-text)',
                            padding: '1px 6px', borderRadius: 'var(--radius-full)', fontWeight: 600,
                          }}>
                            Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                className="btn btn-primary"
                onClick={handleTopup}
                disabled={topupLoading || topupAmount < 5 || (topupMode === 'h2h' && !topupCrypto)}
              >
                {topupLoading ? <Loader2 size={16} className="spinning" /> : <Zap size={16} />}
                Создать счёт на ${topupAmount}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Expenses Summary ─────────────────────────────── */}
      {expenses && (
        <div className="stat-grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ '--accent': '#6366f1' }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: '#6366f115', color: '#6366f1' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div className="stat-card-value">${(expenses.total_cost_usd || 0).toFixed(2)}</div>
            <div className="stat-card-label">Расходы за месяц</div>
          </div>
          <div className="stat-card" style={{ '--accent': '#06b6d4' }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: '#06b6d415', color: '#06b6d4' }}>
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-card-value">{(expenses.hours_processed || 0).toFixed(1)}h</div>
            <div className="stat-card-label">Часов обработано</div>
          </div>
          <div className="stat-card" style={{ '--accent': '#10b981' }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: '#10b98115', color: '#10b981' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-card-value">{expenses.forecast_days_remaining || '∞'}</div>
            <div className="stat-card-label">Дней баланса</div>
          </div>
          <div className="stat-card" style={{ '--accent': '#f59e0b' }}>
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                <Receipt size={20} />
              </div>
            </div>
            <div className="stat-card-value">{payments.length}</div>
            <div className="stat-card-label">Платежей</div>
          </div>
        </div>
      )}

      {/* ── Payment History ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Receipt size={16} /> История платежей</h3>
          <span className="badge badge-info">{payments.length}</span>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Нет платежей"
            description="История пополнений и расходов появится здесь"
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Крипто</th>
                  <th>Метод</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_LABELS[p.status] || { label: p.status || '—', cls: 'badge-muted' };
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        #{p.id}
                      </td>
                      <td style={{ fontSize: 'var(--font-sm)' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '—'}
                        {p.created_at && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 'var(--font-xs)' }}>
                            {new Date(p.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        ${p.amount_usd?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {p.crypto_amount && p.crypto_currency
                          ? `${p.crypto_amount} ${p.crypto_currency}`
                          : '—'}
                      </td>
                      <td style={{ fontSize: 'var(--font-xs)' }}>
                        <span className="badge badge-muted">
                          {p.method || p.provider || 'crypto'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
