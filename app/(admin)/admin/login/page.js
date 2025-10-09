'use client'
import React, { useEffect, useState } from "react";
import { Form, Input, Button } from "@heroui/react";
import { adminSignInAction } from "@/app/actions";
// Toast removed - not available in @heroui/react

export default function AdminLoginPage({ searchParams }) {
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);

  // searchParams 처리
  useEffect(() => {
    const handleSearchParams = async () => {
      if (searchParams) {
        const resolvedSearchParams = await searchParams;
        setError(resolvedSearchParams?.error);
      }
    };
    handleSearchParams();
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined' && rememberLogin) {
      const savedEmail = localStorage.getItem('admin_login_email');
      const savedPassword = localStorage.getItem('admin_login_password');
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, [rememberLogin]);

  const handleSaveLogin = () => {
    if (typeof window !== 'undefined' && rememberLogin) {
      localStorage.setItem('admin_login_email', email);
      localStorage.setItem('admin_login_password', password);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !rememberLogin) {
      localStorage.removeItem('admin_login_email');
      localStorage.removeItem('admin_login_password');
    }
  }, [rememberLogin]);

  // 에러 표시는 searchParams로 처리됨

  return (
    <Form
      className="w-full h-screen justify-center items-center space-y-4"
      validationErrors={errors}
      action={adminSignInAction}
    >
      <div className="flex flex-col gap-4 md:max-w-[30%] w-full max-w-[80%]">
        <h1 className="text-2xl font-bold text-center">관리자 로그인</h1>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div className="flex gap-4">
          <Button className="w-full" color="primary" type="submit" onClick={handleSaveLogin}>
            로그인
          </Button>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="rememberLogin"
            type="checkbox"
            checked={rememberLogin}
            onChange={e => setRememberLogin(e.target.checked)}
            className="mr-2 w-4 h-4 accent-blue-600"
          />
          <label htmlFor="rememberLogin" className="text-sm select-none">
            로그인 정보 기억하기
          </label>
        </div>
      </div>
    </Form>
  );
}

