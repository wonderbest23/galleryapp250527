"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";

export default function ExhibitionRequestPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exhibition_request")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setRequests(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64"><Spinner /></div>
  );

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">전시회 등록 요청</h1>
      {requests.length === 0 ? (
        <p className="text-gray-500">요청이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="shadow-sm">
              <CardBody>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-lg">{req.title}</h2>
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleString()}
                  </span>
                </div>
                {req.content && <p className="whitespace-pre-wrap mb-2 text-sm">{req.content}</p>}
                <p className="text-xs text-gray-500">요청자 ID: {req.user_id}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 