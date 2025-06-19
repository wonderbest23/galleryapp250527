'use client';
import { useState } from 'react';
import { CommunityList } from '../components/community-list';
import { CommunityDetail } from '../components/community-detail';

export default function CommunityAdminPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(1);
  const handleRefresh = () => setRefreshToggle((v)=>v+1);

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">커뮤니티 관리</h1>

        {/* List */}
        <section className="rounded-lg">
          <CommunityList
            onSelectPost={setSelectedPost}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            refreshToggle={refreshToggle}
          />
        </section>

        {/* Detail */}
        <section className="bg-content2 rounded-lg p-4">
          {selectedPost ? (
            <CommunityDetail
              post={selectedPost}
              onUpdate={(p)=>setSelectedPost(p)}
              onDelete={()=>{setSelectedPost(null); setSelectedKeys(new Set([]));}}
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