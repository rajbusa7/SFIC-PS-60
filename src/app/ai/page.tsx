"use client";

import React, { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AiWorkspaceView } from "@/components/ai/AiWorkspaceView";
import { useLanguage } from "@/context/LanguageContext";

function AiWorkspaceFallback() {
  const { t } = useLanguage();
  return <div className="p-8 text-center text-xs text-slate-400">{t.ai.loadingWorkspace}</div>;
}

export default function AiWorkspacePage() {
  return (
    <AppLayout>
      <Suspense fallback={<AiWorkspaceFallback />}>
        <AiWorkspaceView />
      </Suspense>
    </AppLayout>
  );
}
