'use client';
import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Input,
  Switch,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
  Spinner,
} from '@heroui/react';
import { createClient } from '@/utils/supabase/client';

// One-click helper
function useApiCaller() {
  const [busy, setBusy] = useState("");
  const call = async (path, body = {}) => {
    try {
      setBusy(path);
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        addToast({ title: '실패', description: j.error || 'error', color: 'danger' });
      } else {
        addToast({ title: '완료', description: path + ' OK', color: 'success' });
      }
    } catch (e) {
      addToast({ title: '오류', description: e.message, color: 'danger' });
    } finally {
      setBusy("");
    }
  };
  return { busy, call };
}

export default function AiScheduleManagerPage() {
  const supabase = createClient();
  const { busy, call } = useApiCaller();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new
  const [keyword, setKeyword] = useState("한국 미술 전시");

  const defaultPrompt = `제목과 본문을 한국어로 작성해주세요.\n\n규칙:\n1) 제목은 50자 이하\n2) 본문은 400~600자, 존댓말 사용\n3) 마지막 문장을 마침표로 끝내기\n\n제목:`;

  const [form, setForm] = useState({
    name: '',
    cron: '0 9 * * 1',
    prompt_template: defaultPrompt,
    enabled: true,
    auto_publish: false,
    mode: 'ai',
    sources: { brave: true, visitseoul: false },
    visitSeoulMonth: '',
  });

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_post_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('schedule fetch error', error);
      addToast({ title: '조회 오류', description: error.message, color: 'danger' });
    }
    setSchedules(data || []);
    setLoading(false);
  };

  const openNewModal = () => {
    setEditing(null);
    setForm({
      name: '',
      cron: '0 9 * * 1',
      prompt_template: defaultPrompt,
      enabled: true,
      auto_publish: false,
      mode: 'ai',
      sources: { brave: true, visitseoul: false },
      visitSeoulMonth: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (sch) => {
    setEditing(sch);
    let extra = null;
    if (sch.mode === 'scrape') {
      try { extra = JSON.parse(sch.prompt_template || '{}'); } catch {}
    }
    setForm({
      name: sch.name,
      cron: sch.cron,
      prompt_template: sch.prompt_template,
      enabled: sch.enabled,
      auto_publish: sch.auto_publish,
      mode: sch.mode,
      sources: extra?.sources ? {
        brave: extra.sources.includes('brave'),
        visitseoul: extra.sources.includes('visitseoul'),
      } : { brave: true, visitseoul: false },
      visitSeoulMonth: extra?.visitSeoulMonth || '',
    });
    setModalOpen(true);
  };

  const saveSchedule = async () => {
    if (!form.name.trim()) {
      addToast({ title: '이름을 입력하세요', color: 'warning' });
      return;
    }
    if (form.mode !== 'scrape' && !form.prompt_template.trim()) {
      addToast({ title: '프롬프트를 입력하세요', color: 'warning' });
      return;
    }

    let promptTemplateToSave = form.prompt_template;
    if (form.mode === 'scrape') {
      const extra = {
        keyword: form.name,
        sources: Object.entries(form.sources).filter(([k,v])=>v).map(([k])=>k),
        visitSeoulMonth: form.visitSeoulMonth||undefined,
      };
      promptTemplateToSave = JSON.stringify(extra);
    }

    const payload = {
      name: form.name,
      cron: form.cron,
      prompt_template: promptTemplateToSave,
      enabled: form.enabled,
      auto_publish: form.auto_publish,
      mode: form.mode,
    };

    let result;
    if (editing) {
      result = await supabase
        .from('ai_post_schedules')
        .update(payload)
        .eq('id', editing.id)
        .select('*')
        .single();
    } else {
      result = await supabase
        .from('ai_post_schedules')
        .insert(payload)
        .select('*')
        .single();
    }

    const { error } = result;
    if (error) {
      addToast({ title: '저장 실패', description: error.message, color: 'danger' });
      return;
    }

    setModalOpen(false);
    fetchSchedules();
  };

  const deleteSchedule = async (sch) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('ai_post_schedules').delete().eq('id', sch.id);
    if (error) {
      addToast({ title: '삭제 실패', description: error.message, color: 'danger' });
    } else {
      fetchSchedules();
    }
  };

  const runNow = async (sch) => {
    const res = await fetch('/api/ai-generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleId: sch.id, autoPublish: sch.auto_publish, extra: sch.prompt_template }),
    });
    if (res.ok) {
      addToast({ title: '생성 완료', description: 'AI 글이 생성되었습니다.', color: 'success' });
    } else {
      const data = await res.json();
      addToast({ title: '실패', description: data.error || 'error', color: 'danger' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(schedules.length / itemsPerPage));
  const currentItems = schedules.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI 글 스케줄 관리</h1>
          <Button color="primary" size="sm" onPress={openNewModal}>+ 새 스케줄</Button>
        </div>

        {/* 원클릭 뉴스 자동화 패널 */}
        <div className="border p-4 rounded bg-gray-50 space-y-3">
          <h2 className="font-semibold text-[15px]">원클릭 뉴스 자동화</h2>
          <div className="flex flex-wrap gap-3">
            <Input size="sm" className="w-60" value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="스크랩 키워드" />
            <Button color="secondary" size="sm" isLoading={busy === '/api/run-scrapers'} onPress={() => call('/api/run-scrapers',{ keyword })}>① 기사 스크랩</Button>
            <Button color="warning" size="sm" isLoading={busy === '/api/generate-daily-news'} onPress={() => call('/api/generate-daily-news')}>② 30개 뉴스 즉시 발행</Button>
            <Button color="primary" size="sm" isLoading={busy === '/api/schedule-daily-news'} onPress={() => call('/api/schedule-daily-news', { prompt: '한국 미술/예술 최신 뉴스 30개' })}>③ 일일 랜덤 발행 스케줄</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-40"><Spinner size="lg" /></div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <Table aria-label="ai schedules table">
              <TableHeader>
                <TableColumn>이름</TableColumn>
                <TableColumn>크론</TableColumn>
                <TableColumn>활성화</TableColumn>
                <TableColumn>마지막 실행</TableColumn>
                <TableColumn>액션</TableColumn>
              </TableHeader>
              <TableBody emptyContent="데이터가 없습니다." items={currentItems}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.cron}</TableCell>
                    <TableCell>{item.enabled ? 'ON' : 'OFF'}</TableCell>
                    <TableCell>{item.last_run_at ? new Date(item.last_run_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="flat" onPress={() => runNow(item)}>실행</Button>
                        <Button size="sm" variant="bordered" onPress={() => openEditModal(item)}>수정</Button>
                        <Button size="sm" color="danger" variant="light" onPress={() => deleteSchedule(item)}>삭제</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex justify-center mt-3">
              <Pagination total={totalPages} page={page} onChange={setPage} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? '스케줄 수정' : '새 스케줄'}</ModalHeader>
          <ModalBody className="space-y-3">
            <Input label="이름" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} />
            <Input label="Cron 표현식" value={form.cron} onChange={(e)=>setForm({ ...form, cron: e.target.value })} />
            {form.mode!=='scrape' ? (
              <Textarea
                label="프롬프트 템플릿"
                minRows={6}
                placeholder={defaultPrompt}
                value={form.prompt_template}
                onChange={(e)=>setForm({ ...form, prompt_template: e.target.value })}
              />
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">스크레이퍼 선택</label>
                <div className="flex gap-4 items-center text-sm">
                  <label><input type="checkbox" checked={form.sources.brave} onChange={(e)=>setForm({...form,sources:{...form.sources, brave:e.target.checked}})} /> Brave 검색</label>
                  <label><input type="checkbox" checked={form.sources.visitseoul} onChange={(e)=>setForm({...form,sources:{...form.sources, visitseoul:e.target.checked}})} /> VisitSeoul 전시</label>
                  {form.sources.visitseoul && (
                    <input type="text" placeholder="YYYYMM" value={form.visitSeoulMonth} maxLength={6} className="border px-2 py-1 rounded" onChange={(e)=>setForm({...form, visitSeoulMonth:e.target.value.replace(/[^0-9]/g,'').slice(0,6)})} />
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">모드</label>
              <select value={form.mode} onChange={(e)=>setForm({ ...form, mode: e.target.value })} className="border px-2 py-1 rounded text-sm">
                <option value="ai">AI</option>
                <option value="scrape">스크랩</option>
                <option value="mix">Mix</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch isSelected={form.enabled} onValueChange={(v)=>setForm({ ...form, enabled: v })} /> 활성화
              <Switch isSelected={form.auto_publish} onValueChange={(v)=>setForm({ ...form, auto_publish: v })} /> 자동 발행
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={()=>setModalOpen(false)}>취소</Button>
            <Button color="primary" onPress={saveSchedule}>{editing ? '저장' : '추가'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 