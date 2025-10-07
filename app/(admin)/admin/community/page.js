'use client';
import { useState } from 'react';
import { CommunityList } from '../components/community-list';
import { CommunityDetail } from '../components/community-detail';
import { CommunityCreate } from '../components/community-create';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';

export default function CommunityAdminPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const handleRefresh = () => setRefreshToggle((v)=>v+1);

  return (
    <div className="w-full h-full flex flex-col gap-6 py-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">커뮤니티 관리</h1>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '작성 취소' : '새 게시글 작성'}
          </Button>
        </div>

        {/* 게시글 작성 폼 */}
        {showCreateForm && (
          <section className="rounded-lg">
            <CommunityCreate 
              onSuccess={() => {
                setShowCreateForm(false);
                handleRefresh();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </section>
        )}

        {/* List with bulk actions */}
        <section className="rounded-lg">
          <CommunityList
            onSelectPost={setSelectedPost}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            refreshToggle={refreshToggle}
            onBulkDelete={handleRefresh}
          />
        </section>

        {/* Detail */}
        <section className="bg-content2 rounded-lg p-4">
          {selectedPost ? (
            <CommunityDetail
              post={selectedPost}
              onUpdate={(p)=>setSelectedPost(p)}
              onDelete={()=>{setSelectedPost(null); setSelectedKeys(new Set([])); handleRefresh();}}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="text-center text-default-500 py-8">게시글을 선택하면 상세 정보가 표시됩니다.</div>
          )}
        </section>
      </div>
    </div>
  );
} 