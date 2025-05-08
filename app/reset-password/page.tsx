"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage("Invalid or missing token.");
    if (password !== confirm) return setMessage("Passwords do not match.");

    setIsLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setMessage(data.message);
    setIsLoading(false);

    if (res.ok) {
      setTimeout(() => {
        router.push("/account-management/signin");
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-md">
      <input
        type="password"
        placeholder="New password"
        className="w-full border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirm new password"
        className="w-full border p-2 rounded"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>
      {message && <p className="text-center text-sm text-gray-700">{message}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7F4] px-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Reset Your Password</h1>
      <Suspense fallback={<div>Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
