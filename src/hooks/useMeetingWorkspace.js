import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';
import { loadWorkspaceResources, loadWorkspaceResource } from '../workspace/resources';
import { watchProcessing, mergeServerDraft } from '../workspace/processing';

export default function useMeetingWorkspace(uuid) {
  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [versions, setVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [protocolDraft, setProtocolDraft] = useState('');
  const [segments, setSegments] = useState([]);
  const [speakerRenames, setSpeakerRenames] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceErrors, setResourceErrors] = useState({});
  const [retrying, setRetrying] = useState({});
  const loadId = useRef(0);

  const applyResource = useCallback((name, data) => {
    if (name === 'transcript') {
      setTranscript(data);
      setSegments(data?.segments || []);
    } else if (name === 'versions') setVersions(data?.versions || []);
    else if (name === 'templates') setTemplates(data?.templates || []);
    else if (name === 'shareLinks') setShareLinks(data?.links || []);
  }, []);

  const load = useCallback(async () => {
    const requestId = ++loadId.current;
    setLoading(true);
    setError('');
    setResourceErrors({});
    setMeeting(null);
    setTranscript(null);
    setVersions([]);
    setTemplates([]);
    setShareLinks([]);
    setSegments([]);
    setRetrying({});
    try {
      const detail = await api.getMeetingDetail(uuid);
      if (requestId !== loadId.current) return;
      setMeeting(detail);
      setProtocolDraft(detail.protocol_md || '');
      setSelectedTemplate(detail.protocol_template || 'standard');
      setSpeakerRenames({});
      const { data, errors } = await loadWorkspaceResources(api, uuid);
      if (requestId !== loadId.current) return;
      Object.entries(data).forEach(([name, value]) => applyResource(name, value));
      setResourceErrors(errors);
    } catch (err) {
      if (requestId === loadId.current) setError(err.message || 'Не удалось загрузить встречу');
    } finally {
      if (requestId === loadId.current) setLoading(false);
    }
  }, [uuid, applyResource]);

  useEffect(() => {
    load();
    return () => { loadId.current += 1; };
  }, [load]);

  const retryResource = async (name) => {
    const requestId = loadId.current;
    setRetrying((current) => ({ ...current, [name]: true }));
    try {
      const data = await loadWorkspaceResource(api, uuid, name);
      if (requestId !== loadId.current) return;
      applyResource(name, data);
      setResourceErrors((current) => ({ ...current, [name]: null }));
    } catch (err) {
      if (requestId === loadId.current) {
        setResourceErrors((current) => ({ ...current, [name]: err.message || 'Ошибка загрузки' }));
      }
    } finally {
      if (requestId === loadId.current) setRetrying((current) => ({ ...current, [name]: false }));
    }
  };


  const [progressError, setProgressError] = useState('');
  const active = Boolean(meeting?.processing?.is_processing);
  const serverProtocol = meeting?.protocol_md || '';
  const serverTemplate = meeting?.protocol_template || 'standard';
  useEffect(() => {
    if (!active) return;
    return watchProcessing(api, uuid, {
      onUpdate(detail) {
        setProgressError('');
        setMeeting(detail);
        setProtocolDraft((draft) => mergeServerDraft(draft, serverProtocol, detail.protocol_md || ''));
        setSelectedTemplate((draft) => mergeServerDraft(draft, serverTemplate, detail.protocol_template || 'standard'));
      },
      onError(err) { setProgressError(err.message || 'Не удалось обновить статус'); },
    });
  }, [uuid, active, serverProtocol, serverTemplate]);

  // Hydrate a transcript that first became available during processing.
  // Existing transcript edits stay untouched by background refreshes.
  const transcriptAvailable = Boolean(meeting?.processing?.has_transcript);
  useEffect(() => {
    if (!transcriptAvailable || transcript !== null) return;
    let cancelled = false;
    loadWorkspaceResource(api, uuid, 'transcript').then((data) => {
      if (!cancelled) {
        applyResource('transcript', data);
        setResourceErrors((current) => ({ ...current, transcript: null }));
      }
    }).catch((err) => {
      if (!cancelled) setResourceErrors((current) => ({ ...current, transcript: err.message || 'Ошибка загрузки' }));
    });
    return () => { cancelled = true; };
  }, [uuid, transcriptAvailable, transcript, applyResource]);

  return {
    meeting, setMeeting, transcript, setTranscript, versions, setVersions,
    templates, shareLinks, setShareLinks, protocolDraft, setProtocolDraft,
    segments, setSegments, speakerRenames, setSpeakerRenames,
    selectedTemplate, setSelectedTemplate, loading, error,
    resourceErrors, setResourceErrors, retrying, retryResource, load, progressError,
  };
}
