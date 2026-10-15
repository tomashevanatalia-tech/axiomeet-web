// Keep independent requests independent: a failed tab must not erase other data.
export const RESOURCE_LABELS = {
  transcript: 'транскрипт',
  versions: 'историю версий',
  templates: 'шаблоны протокола',
  shareLinks: 'публичные ссылки',
};

const RESOURCE_METHODS = {
  transcript: 'getMeetingTranscript',
  versions: 'getProtocolVersions',
  templates: 'getProtocolTemplates',
  shareLinks: 'listShareLinks',
};

export async function loadWorkspaceResource(client, uuid, name) {
  const method = RESOURCE_METHODS[name];
  if (!Object.hasOwn(RESOURCE_METHODS, name)) throw new Error(`Unknown workspace resource: ${name}`);
  return name === 'templates' ? client[method]() : client[method](uuid);
}

export async function loadWorkspaceResources(client, uuid) {
  const names = Object.keys(RESOURCE_METHODS);
  const results = await Promise.allSettled(names.map((name) => loadWorkspaceResource(client, uuid, name)));
  const data = {};
  const errors = {};
  results.forEach((result, index) => {
    const name = names[index];
    if (result.status === 'fulfilled') data[name] = result.value;
    else errors[name] = result.reason?.message || 'Ошибка загрузки';
  });
  return { data, errors };
}
