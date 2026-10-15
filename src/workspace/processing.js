// A refresh may replace untouched server text, but never a user's draft.
export function mergeServerDraft(draft, previousServerValue, nextServerValue) {
  return draft === previousServerValue ? nextServerValue : draft;
}

// One GET at a time. An unmounted or changed meeting never receives late results.
export function watchProcessing(client, uuid, { onUpdate, onError, interval = 15000,
  schedule = setTimeout, cancel = clearTimeout }) {
  let stopped = false;
  let timer;
  const poll = async () => {
    try {
      const detail = await client.getMeetingDetail(uuid);
      if (stopped) return;
      onUpdate(detail);
      if (!detail.processing?.is_processing) return;
    } catch (error) {
      if (stopped) return;
      onError(error);
    }
    if (!stopped) timer = schedule(poll, interval);
  };
  timer = schedule(poll, interval);
  return () => { stopped = true; cancel(timer); };
}
