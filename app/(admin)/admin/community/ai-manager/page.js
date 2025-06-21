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

export default function AiScheduleManagerPage() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new

  const [form, setForm] = useState({
    name: '',
    cron: '0 9 * * 1',
    prompt_template: '',
    enabled: true,
    auto_publish: false,
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
    setForm({ name: '', cron: '0 9 * * 1', prompt_template: '', enabled: true, auto_publish: false });
    setModalOpen(true);
  };

  const openEditModal = (sch) => {
    setEditing(sch);
    setForm({
      name: sch.name,
      cron: sch.cron,
      prompt_template: sch.prompt_template,
      enabled: sch.enabled,
      auto_publish: sch.auto_publish,
    });
    setModalOpen(true);
  };

  const saveSchedule = async () => {
    if (!form.name.trim()) {
      addToast({ title: '이름을 입력하세요', color: 'warning' });
      return;
    }
    if (!form.prompt_template.trim()) {
      addToast({ title: '프롬프트를 입력하세요', color: 'warning' });
      return;
    }

    const payload = {
      name: form.name,
      cron: form.cron,
      prompt_template: form.prompt_template,
      enabled: form.enabled,
      auto_publish: form.auto_publish,
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
      body: JSON.stringify({ scheduleId: sch.id, prompt: sch.prompt_template, autoPublish: sch.auto_publish }),
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
            <Textarea label="프롬프트 템플릿" minRows={4} value={form.prompt_template} onChange={(e)=>setForm({ ...form, prompt_template: e.target.value })} />
            <div className="flex items-center gap-2">
              <Switch isSelected={form.enabled} onChange={(v)=>setForm({ ...form, enabled: v })} /> 활성화
              <Switch isSelected={form.auto_publish} onChange={(v)=>setForm({ ...form, auto_publish: v })} /> 자동 발행
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