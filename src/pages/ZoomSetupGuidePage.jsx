import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Cloud, Copy,
  Download, ExternalLink, KeyRound, LockKeyhole, Radio, ShieldCheck, Video,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const REQUIRED_SCOPES = [
  'cloud_recording:read:list_user_recordings:admin',
  'cloud_recording:read:list_recording_files:admin',
  'cloud_recording:read:recording:admin',
  'user:read:list_users:admin',
  'user:read:user:admin',
  'meeting:read:meeting:admin',
  'meeting:read:list_past_participants:admin',
];

const CLOUD_RECORDING_VALUES = [
  { label: 'Cloud Recording', value: 'ON' },
  { label: 'Video layout', value: 'Record active speaker with shared screen' },
  { label: 'Record audio-only files', value: 'ON' },
  { label: 'Record a separate audio file of each participant', value: 'ON — ОБЯЗАТЕЛЬНО' },
];

const AUTOMATIC_RECORDING_VALUES = [
  { label: 'Automatic recording', value: 'ON' },
  { label: 'Storage', value: 'Record in the cloud' },
  { label: 'Retention', value: '30 days or more' },
];

const SENATE_APP_VALUES = [
  { label: 'App Type', value: 'Server-to-Server OAuth' },
  { label: 'App Name', value: 'AxioMeet' },
  { label: 'Company Name', value: 'Senate' },
  { label: 'Developer Contact Name', value: 'Andrey Zaytsev' },
  { label: 'Developer Contact Email', value: 'admin@axiomeet.com' },
];

const FOX_APP_VALUES = [
  { label: 'App Type', value: 'Server-to-Server OAuth' },
  { label: 'App Name', value: 'AxioMeet — FOXMetoD' },
  { label: 'Company Name', value: 'FOXMetoD' },
  { label: 'Developer Contact Name', value: 'Andrey Zaytsev' },
  { label: 'Developer Contact Email', value: 'admin@axiomeet.com' },
];

const CREDENTIAL_SOURCE_VALUES = [
  { label: 'Account ID', value: 'Zoom → App Credentials → Account ID', copyable: false },
  { label: 'Client ID', value: 'Zoom → App Credentials → Client ID', copyable: false },
  { label: 'Client Secret', value: 'Zoom → App Credentials → Client Secret', copyable: false },
  { label: 'Activation status', value: 'Active' },
];

const SENATE_CONNECTION_VALUES = [
  { label: 'Название подключения', value: 'Senate Zoom' },
  { label: 'Account ID', value: 'вставьте Account ID из App Credentials', copyable: false },
  { label: 'Client ID', value: 'вставьте Client ID из App Credentials', copyable: false },
  { label: 'Client Secret', value: 'вставьте Client Secret из App Credentials', copyable: false },
  { label: 'Папка Google Drive', value: 'Senate — Zoom recordings' },
];

const TEST_MEETING_VALUES = [
  { label: 'Topic', value: 'AxioMeet — проверка Zoom' },
  { label: 'Duration', value: '5 minutes' },
  { label: 'Participants', value: '2 or more' },
  { label: 'Expected video', value: '1 MP4' },
  { label: 'Expected audio', value: 'separate M4A files for participants' },
];

const WEBHOOK_VALUES = [
  { label: 'Subscription Name', value: 'AxioMeet' },
  { label: 'Event notification endpoint URL', value: 'https://app.axiomeet.io/webhook' },
  { label: 'Event', value: 'All Recordings have completed' },
  { label: 'Event code', value: 'recording.completed' },
];

function GuideStep({ id, number, title, children }) {
  return (
    <section className="zoom-guide-step" id={id} aria-labelledby={`${id}-title`}>
      <div className="zoom-guide-step-number">{number}</div>
      <div className="zoom-guide-step-body">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

function CheckList({ items }) {
  return (
    <ul className="zoom-guide-checklist">
      {items.map((item) => <li key={item}><CheckCircle2 size={17} /> <span>{item}</span></li>)}
    </ul>
  );
}

function CopyValue({ label, value, copyable = true }) {
  const [copied, setCopied] = useState(false);

  const copyValue = async () => {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="zoom-guide-copy-row">
      <div>
        <span>{label}</span>
        <code>{value}</code>
      </div>
      {copyable ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={copyValue} aria-label={`Скопировать значение поля ${label}`}>
          <Copy size={14} /> {copied ? 'Скопировано' : 'Копировать'}
        </button>
      ) : <span className="zoom-guide-copy-source">из вашего Zoom</span>}
    </div>
  );
}

function CopyValues({ title, items, note }) {
  return (
    <div className="zoom-guide-copy-block">
      <h3>{title}</h3>
      <div className="zoom-guide-copy-grid">
        {items.map((item) => <CopyValue key={`${item.label}-${item.value}`} {...item} />)}
      </div>
      {note && <p className="zoom-guide-copy-note">{note}</p>}
    </div>
  );
}

export default function ZoomSetupGuidePage() {
  const [copied, setCopied] = useState(false);

  const copyScopes = async () => {
    try {
      await navigator.clipboard.writeText(REQUIRED_SCOPES.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="platform-page zoom-guide-page">
      <PageHeader
        title="Как настроить Zoom для передачи данных"
        subtitle="Полная настройка облачной записи и Server-to-Server OAuth для AxioMeet"
        breadcrumbs={[{ label: 'Управление' }, { label: 'Настройки', href: '/admin/settings' }, { label: 'Настройка Zoom' }]}
      >
        <a className="btn btn-secondary btn-sm" href="/docs/Zoom_AxioMeet_setup_RU.pptx" download><Download size={14} /> Скачать презентацию</a>
        <Link className="btn btn-secondary btn-sm" to="/admin/settings?zoom_setup=1"><ArrowLeft size={14} /> К подключениям</Link>
      </PageHeader>

      <div className="zoom-guide-hero">
        <div className="zoom-guide-hero-icon"><BookOpen size={28} /></div>
        <div>
          <h2>Что будет передаваться</h2>
          <p>AxioMeet получает готовую облачную запись Zoom, сведения о встрече и список участников. Стандартное подключение работает в режиме чтения и не создаёт и не удаляет встречи в Zoom.</p>
        </div>
      </div>

      <div className="zoom-guide-warning">
        <AlertTriangle size={20} />
        <div><strong>Настройку выполняет владелец или администратор Zoom.</strong><span>Client Secret вводите только в кабинете AxioMeet. Не отправляйте его в почте, чате или тикете поддержки.</span></div>
      </div>

      <div className="zoom-guide-layout">
        <aside className="zoom-guide-aside">
          <nav className="zoom-guide-toc" aria-label="Шаги настройки Zoom">
            <strong>Шаги</strong>
            <a href="#zoom-precheck">1. Права и лицензии</a>
            <a href="#zoom-cloud">2. Облачная запись</a>
            <a href="#zoom-auto">3. Автозапись</a>
            <a href="#zoom-app">4. Приложение OAuth</a>
            <a href="#zoom-scopes">5. Разрешения</a>
            <a href="#zoom-credentials">6. Реквизиты</a>
            <a href="#zoom-connect">7. Подключение</a>
            <a href="#zoom-test">8. Проверка</a>
          </nav>
          <div className="zoom-guide-aside-note">
            <ShieldCheck size={18} />
            <div><strong>Безопасный минимум</strong><span>Для обычной передачи записей не добавляйте write/delete scopes.</span></div>
          </div>
        </aside>

        <main className="zoom-guide-content">
          <GuideStep id="zoom-precheck" number="1" title="Проверьте права, тариф и хостов">
            <p>Приложение создаётся внутри того Zoom-аккаунта, записи которого должен получать AxioMeet.</p>
            <CheckList items={[
              'Zoom Pro, Business, Education или Enterprise: на бесплатном тарифе Cloud Recording недоступен.',
              'Организаторы встреч имеют статус Licensed, а не Basic.',
              'У вашей роли включены View и Edit для Zoom for developers и разрешено добавлять admin scopes.',
              'Приложение будет принадлежать пользователю, чьи административные права не планируется отзывать.',
            ]} />
            <div className="zoom-guide-path"><LockKeyhole size={17} /><span>Если пункта Developer нет: <b>User Management → Roles → Role Settings → Advanced features → Zoom for developers → View + Edit</b>.</span></div>
          </GuideStep>

          <GuideStep id="zoom-cloud" number="2" title="Включите Cloud Recording на уровне аккаунта">
            <div className="zoom-guide-path"><Cloud size={17} /><span><b>Account Management → Account Settings → Recording & Transcript → Cloud Recording → ON</b></span></div>
            <p>Нажмите значок замка, если настройка должна действовать для всех групп и пользователей. Серый переключатель означает, что параметр заблокирован на более высоком уровне.</p>
            <div className="zoom-guide-path"><Radio size={17} /><span><b>Cloud Recording → Advanced cloud recording settings → Record a separate audio file of each participant → ON</b></span></div>
            <div className="zoom-guide-two-column">
              <div>
                <h3>Обязательные настройки</h3>
                <ul>
                  <li>Оставьте хотя бы один видеофайл MP4.</li>
                  <li>Для базового сценария включите <b>Record active speaker with shared screen</b>.</li>
                  <li>Обязательно включите <b>Record a separate audio file of each participant</b>.</li>
                  <li>Не запрещайте скачивание облачных записей для администратора интеграции.</li>
                </ul>
              </div>
              <div>
                <h3>Не требуется</h3>
                <ul>
                  <li>Zoom Audio Transcript — AxioMeet делает собственную расшифровку.</li>
                  <li>Несколько отдельных видеоформатов, если они не нужны архиву.</li>
                </ul>
              </div>
            </div>
            <CopyValues
              title="Точные значения"
              items={CLOUD_RECORDING_VALUES}
              note="Ищите названия на английском: так они совпадают с интерфейсом и поиском настроек Zoom."
            />
          </GuideStep>

          <GuideStep id="zoom-auto" number="3" title="Включите автоматическую запись именно в облако">
            <div className="zoom-guide-path"><Video size={17} /><span><b>Recording & Transcript → General → Automatic recording → ON → Record in the cloud → Save</b></span></div>
            <CheckList items={[
              'При необходимости заблокируйте настройку значком замка для всего аккаунта.',
              'Старые встречи, повторяющиеся серии и Personal Meeting ID проверьте отдельно: изменение действует только для будущих встреч.',
              'Встречи, которые создаёт Onboardix, уже запрашивают auto_recording=cloud, но Zoom всё равно должен разрешать Cloud Recording хосту.',
              'На время теста отключите автоудаление. После стабильной проверки задавайте срок не короче 30 дней.',
              'Убедитесь, что облачное хранилище Zoom не заполнено.',
            ]} />
            <CopyValues title="Точные значения" items={AUTOMATIC_RECORDING_VALUES} />
          </GuideStep>

          <GuideStep id="zoom-app" number="4" title="Создайте отдельное Server-to-Server OAuth приложение">
            <ol className="zoom-guide-numbered">
              <li>Откройте <a href="https://marketplace.zoom.us/" target="_blank" rel="noreferrer">Zoom App Marketplace <ExternalLink size={13} /></a> и войдите под администратором.</li>
              <li>Нажмите <b>Developer → Build App</b>.</li>
              <li>Выберите <b>Server-to-Server OAuth</b> и нажмите <b>Create</b>.</li>
              <li>Введите <b>App Name</b> из готового блока ниже и нажмите <b>Create</b>.</li>
              <li>Во вкладке <b>Information</b> вставьте готовые Company Name, Developer Contact Name и Developer Contact Email.</li>
            </ol>
            <CopyValues
              title="Готовые значения для Zoom-аккаунта Senate"
              items={SENATE_APP_VALUES}
              note="Копируйте без кавычек. Company Name, имя и email обязательны для активации приложения."
            />
            <CopyValues
              title="Если FOXMetoD подключается к кабинету Senate"
              items={FOX_APP_VALUES}
              note="Создайте отдельное приложение в Zoom-аккаунте FOXMetoD. Client Secret приложения Senate использовать нельзя."
            />
            <div className="zoom-guide-info"><KeyRound size={18} /><span>Создавайте отдельное приложение для каждого Zoom-аккаунта и сервиса. Так проще отозвать доступ и проверить журналы.</span></div>
          </GuideStep>

          <GuideStep id="zoom-scopes" number="5" title="Добавьте точные granular scopes">
            <p>Откройте <b>Scopes → Add Scopes</b>. Ищите каждый scope по имени, отмечайте вариант с окончанием <code>:admin</code>, затем нажмите <b>Done</b>.</p>
            <div className="zoom-guide-scope-head">
              <div><strong>Обязательные — чтение записей и метаданных</strong><span>Без них подключение может получить токен, но показывать 0 записей.</span></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyScopes}><Copy size={14} /> {copied ? 'Скопировано' : 'Скопировать список'}</button>
            </div>
            <div className="zoom-guide-scopes">
              {REQUIRED_SCOPES.map((scope) => <code key={scope}>{scope}</code>)}
            </div>
            <div className="zoom-guide-info">
              <KeyRound size={18} />
              <span><b>Последний scope для участников обязателен.</b> Без него AxioMeet не сможет надёжно получать имена и состав участников встречи.</span>
            </div>
            <div className="zoom-guide-warning compact"><AlertTriangle size={18} /><div><strong>Не заменяйте granular scopes старыми recording:read:admin, user:read:admin и dashboard:read:admin.</strong><span>Новые Server-to-Server приложения Zoom используют granular scopes.</span></div></div>
          </GuideStep>

          <GuideStep id="zoom-credentials" number="6" title="Активируйте приложение и возьмите три реквизита">
            <ol className="zoom-guide-numbered">
              <li>Откройте <b>Activation</b> и нажмите <b>Activate your app</b>.</li>
              <li>Убедитесь, что статус приложения — <b>Active</b>.</li>
              <li>На вкладке <b>App Credentials</b> скопируйте <b>Account ID, Client ID и Client Secret</b>.</li>
              <li>После изменения scopes снова сохраните изменения и убедитесь, что приложение активно.</li>
            </ol>
            <CopyValues
              title="Что копировать из App Credentials"
              items={CREDENTIAL_SOURCE_VALUES}
              note="Секретные реквизиты не публикуются в инструкции: возьмите их в своём приложении и сразу вставьте в защищённую форму AxioMeet."
            />
            <div className="zoom-guide-warning compact"><AlertTriangle size={18} /><div><strong>Client Secret показывается и используется как пароль.</strong><span>Если он попал в переписку или снимок экрана, сгенерируйте новый до подключения.</span></div></div>
          </GuideStep>

          <GuideStep id="zoom-connect" number="7" title="Введите реквизиты в AxioMeet">
            <ol className="zoom-guide-numbered">
              <li>Вернитесь в <b>Управление → Настройки → Подключения</b>.</li>
              <li>Нажмите <b>Подключить Zoom</b>.</li>
              <li>Укажите понятное название, затем вставьте Account ID, Client ID и Client Secret из одного приложения.</li>
              <li>Выберите отдельную папку Google Drive или оставьте общую папку организации.</li>
              <li>Нажмите <b>Проверить и подключить</b>. Секрет повторно в интерфейсе не показывается.</li>
            </ol>
            <CopyValues
              title="Готовые значения для кабинета Senate"
              items={SENATE_CONNECTION_VALUES}
              note="Для FOXMetoD: название подключения «FOXMetoD Zoom — аренда Senate», папка «Senate — FOXMetoD Zoom recordings»."
            />
            <CopyValues
              title="Если API-ключ Onboardix действительно отсутствует"
              items={[{ label: 'Название ключа', value: 'Onboardix — Senate' }]}
              note="Сначала обновите страницу и уточните у администратора. Рабочий ключ нельзя удалять или перевыпускать без согласования с Onboardix."
            />
            <Link className="btn btn-primary zoom-guide-connect-button" to="/admin/settings?zoom_setup=1"><Video size={15} /> Открыть форму подключения</Link>
          </GuideStep>

          <GuideStep id="zoom-test" number="8" title="Проведите контрольную встречу">
            <CheckList items={[
              'Создайте новую встречу на 3–5 минут, включите микрофон и на минуту покажите экран.',
              'Завершите встречу для всех и дождитесь в Zoom статуса Cloud Recording: Completed.',
              'В записи должен быть MP4 с ненулевым размером и отдельные аудиофайлы участников.',
              'В AxioMeet нажмите «Проверить» у нужного Zoom-подключения.',
              'Если webhook не настроен, дождитесь следующего планового сканирования или запустите проверку вручную.',
              'Проверьте появление встречи, расшифровки и нужной папки Google Drive.',
            ]} />
            <CopyValues
              title="Параметры контрольной встречи"
              items={TEST_MEETING_VALUES}
              note="Оба участника должны произнести несколько фраз. Отдельные M4A — обязательный критерий прохождения теста."
            />
          </GuideStep>

          <section className="zoom-guide-secondary-section">
            <div className="zoom-guide-secondary-title"><Radio size={20} /><div><h2>Webhook — только для ускорения</h2><p>Базовая передача работает через периодическую проверку Zoom.</p></div></div>
            <p>Если запись должна попадать в обработку сразу после завершения, сначала согласуйте webhook с администратором AxioMeet. Понадобятся событие <code>recording.completed</code>, проверяемый endpoint и Secret Token, который настраивается на стороне сервера. Не включайте webhook самостоятельно, если вам не выдали отдельные параметры.</p>
            <CopyValues
              title="Точные значения webhook"
              items={WEBHOOK_VALUES}
              note="Secret Token в публичной инструкции не размещается — его передаёт администратор AxioMeet по защищённому каналу."
            />
          </section>

          <section className="zoom-guide-troubleshooting">
            <h2>Если запись не появилась</h2>
            <div className="zoom-guide-troubleshooting-grid">
              <div><strong>Нет Developer / нужных scopes</strong><span>Владелец Zoom должен расширить роль: Zoom for developers и права на записи/пользователей.</span></div>
              <div><strong>Реквизиты отклонены</strong><span>Проверьте, что три значения взяты из одного приложения и его статус Active.</span></div>
              <div><strong>Подключение активно, но 0 записей</strong><span>Сверьте все granular scopes, Cloud Recording и лицензию конкретного хоста.</span></div>
              <div><strong>Запись сохранилась только на компьютер</strong><span>В Automatic recording выберите Record in the cloud и пересоздайте тестовую встречу.</span></div>
              <div><strong>Старая серия не записывается</strong><span>Отредактируйте эту серию или PMI отдельно: общая настройка меняет только будущие встречи.</span></div>
              <div><strong>Запись исчезла</strong><span>Проверьте срок автоудаления и корзину Zoom. Для надёжности храните записи не менее 30 дней.</span></div>
            </div>
          </section>

          <footer className="zoom-guide-sources">
            <strong>Официальные справочные материалы Zoom</strong>
            <a href="https://developers.zoom.us/docs/internal-apps/create/" target="_blank" rel="noreferrer">Создание Server-to-Server OAuth приложения <ExternalLink size={13} /></a>
            <a href="https://developers.zoom.us/docs/internal-apps/oauth-scopes-overview/" target="_blank" rel="noreferrer">Granular scopes <ExternalLink size={13} /></a>
            <a href="https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0063923&language=en_US" target="_blank" rel="noreferrer">Cloud Recording <ExternalLink size={13} /></a>
            <a href="https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067954&language=en_US" target="_blank" rel="noreferrer">Automatic recording <ExternalLink size={13} /></a>
          </footer>
        </main>
      </div>
    </div>
  );
}
