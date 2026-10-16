const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LONG_REQUEST = /protocol|transcript|transcrib|upload|reprocess|regenerate|push-to-crm|distribute|demo-meeting|costs\/live|test-connection/i;

export function requestTimeoutMs(url) {
  return LONG_REQUEST.test(url) ? 90_000 : 30_000;
}

export class RequestTimeoutError extends Error {
  constructor() {
    super('Превышено время ожидания ответа. Проверьте результат операции перед повтором.');
    this.name = 'TimeoutError';
  }
}

/** Bound headers AND response-body reading. Retry only safe requests once. */
export async function requestJson(url, options = {}, policy = {}) {
  const { fetchImpl = globalThis.fetch, timeoutMs = requestTimeoutMs(url) } = policy;
  const method = (options.method || 'GET').toUpperCase();
  const external = options.signal;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (external?.aborted) throw external.reason || new DOMException('Aborted', 'AbortError');
    const controller = new AbortController();
    let timedOut = false;
    const abortExternal = () => controller.abort(external?.reason);
    external?.addEventListener('abort', abortExternal, { once: true });
    let abortListener;
    const aborted = new Promise((_, reject) => {
      abortListener = () => reject(controller.signal.reason || new DOMException('Aborted', 'AbortError'));
      controller.signal.addEventListener('abort', abortListener, { once: true });
    });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new RequestTimeoutError());
    }, timeoutMs * (attempt + 1));
    try {
      const operation = (async () => {
        const response = await fetchImpl(url, { ...options, signal: controller.signal });
        const data = response.status === 204 ? null : await response.json().catch(() => null);
        if (controller.signal.aborted) throw controller.signal.reason;
        return { response, data };
      })();
      return await Promise.race([operation, aborted]);
    } catch (error) {
      const retryableAbort = timedOut || (error instanceof Error && error.name === 'AbortError');
      if (attempt === 0 && SAFE_METHODS.has(method) && retryableAbort && !external?.aborted) continue;
      throw timedOut ? new RequestTimeoutError() : error;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', abortExternal);
      if (abortListener) controller.signal.removeEventListener('abort', abortListener);
    }
  }
  throw new RequestTimeoutError();
}
