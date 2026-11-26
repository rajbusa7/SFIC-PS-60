"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
} from "lucide-react";
import type { AiProviderName, AiTaskType, AiProviderConfig, AiUsageMetric } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface ProviderStatus {
  provider: AiProviderName;
  name: string;
  configured: boolean;
  supportedTasks: string[];
  supportedLanguages: string[];
  keyPreview: string | null;
}

export function AdminAiProviderSettings() {
  const { t, tr } = useLanguage();
  const ap = t.aiProviders;
  const TASK_NAMES: Record<AiTaskType, { title: string; desc: string }> = {
    chat: { title: ap.taskChatTitle, desc: ap.taskChatDesc },
    simplification: { title: ap.taskSimplificationTitle, desc: ap.taskSimplificationDesc },
    translation: { title: ap.taskTranslationTitle, desc: ap.taskTranslationDesc },
    speech_to_text: { title: ap.taskSttTitle, desc: ap.taskSttDesc },
    text_to_speech: { title: ap.taskTtsTitle, desc: ap.taskTtsDesc },
    assistant: { title: ap.taskAssistantTitle, desc: ap.taskAssistantDesc },
  };
  const [configs, setConfigs] = useState<AiProviderConfig[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<{
    totalRequests: number;
    errorCount: number;
    averageLatencyMs: number;
    totalCostUsd: number;
    recentMetrics: AiUsageMetric[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [pingingProvider, setPingingProvider] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});
  const [savingTask, setSavingTask] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/ai-providers");
      const data = await res.json();
      if (res.ok && data.success) {
        setConfigs(data.data.configs);
        setProviderStatuses(data.data.providerStatus);
        setMetricsSummary(data.data.metricsSummary);
      }
    } catch (e) {
      console.error("Failed to load AI provider settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestPing = async (provider: AiProviderName) => {
    setPingingProvider(provider);
    try {
      const res = await fetch("/api/admin/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_ping", provider }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPingResults((prev) => ({
          ...prev,
          [provider]: {
            success: data.data.pingSuccess,
            latencyMs: data.data.latencyMs,
            message: data.data.message,
          },
        }));
      } else {
        setPingResults((prev) => ({
          ...prev,
          [provider]: {
            success: false,
            latencyMs: 0,
            message: data.error || ap.pingFailed,
          },
        }));
      }
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          latencyMs: 0,
          message: err.message || ap.networkError,
        },
      }));
    } finally {
      setPingingProvider(null);
    }
  };

  const handleConfigChange = async (
    task: AiTaskType,
    field: "primaryProvider" | "fallbackProvider" | "enabled",
    val: any
  ) => {
    setSavingTask(task);
    setSaveNotification(null);

    const currentConfig = configs.find((c) => c.task === task) || {
      task,
      primaryProvider: "offline_fallback",
      fallbackProvider: "offline_fallback",
      enabled: true,
    };

    const updated = {
      ...currentConfig,
      [field]: val,
    };

    try {
      const res = await fetch("/api/admin/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          task,
          primaryProvider: updated.primaryProvider,
          fallbackProvider: updated.fallbackProvider,
          enabled: updated.enabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfigs(data.data);
        setSaveNotification(tr("aiProviders.routingUpdated", { task: TASK_NAMES[task]?.title || task }));
        setTimeout(() => setSaveNotification(null), 3000);
      }
    } catch (e: any) {
      console.error("Config update error:", e);
    } finally {
      setSavingTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#49352F]/15">
        <Loader2 className="w-6 h-6 animate-spin text-[#49352F] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#49352F]">{ap.loading}</p>
      </div>
    );
  }

  const tasks: AiTaskType[] = [
    "simplification",
    "translation",
    "speech_to_text",
    "text_to_speech",
    "assistant",
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#49352F]/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2CAB3]/40 border border-[#49352F]/10 text-xs font-bold text-[#49352F] mb-1">
              <Layers className="w-3.5 h-3.5 text-[#2E7D5E]" />
              {ap.badgeArchitecture}
            </div>
            <h2 className="text-lg font-bold text-[#49352F]">
              {ap.heading}
            </h2>
            <p className="text-xs text-[#49352F]/70">
              {ap.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-providers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2E7D5E] text-white hover:bg-[#25684E] transition-all"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{ap.fullDashboardLink}</span>
            </Link>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#49352F]/20 text-[#49352F] hover:bg-[#FAF6E9] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{ap.refreshTelemetryBtn}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Summary Cards */}
        {metricsSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <div className="p-3 bg-white rounded-xl border border-[#49352F]/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#49352F]/70">
                <span>{ap.totalCallsCard}</span>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 text-2xl font-black text-[#49352F]">
                {metricsSummary.totalRequests}
              </div>
              <div className="text-[11px] text-[#2E7D5E] font-medium mt-0.5">
                {metricsSummary.totalRequests > 0
                  ? tr("aiProviders.successRateSuffix", { rate: Math.round(((metricsSummary.totalRequests - metricsSummary.errorCount) / metricsSummary.totalRequests) * 100) })
                  : ap.readyForRequests}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#49352F]/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#49352F]/70">
                <span>{ap.avgLatencyCard}</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 text-2xl font-black text-[#49352F]">
                {metricsSummary.averageLatencyMs}ms
              </div>
              <div className="text-[11px] text-[#49352F]/60 mt-0.5">
                {ap.acrossActiveProviders}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#49352F]/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#49352F]/70">
                <span>{ap.errorCountCard}</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-amber-900">
                {metricsSummary.errorCount}
              </div>
              <div className="text-[11px] text-[#49352F]/60 mt-0.5">
                {ap.gracefulFallbacksHint}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#49352F]/10">
              <div className="flex items-center justify-between text-xs font-semibold text-[#49352F]/70">
                <span>{ap.estApiCostCard}</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-900">
                ${metricsSummary.totalCostUsd.toFixed(4)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {ap.optimizedTokenUsage}
              </div>
            </div>
          </div>
        )}
      </div>

      {saveNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* 1. External Providers Connectivity & Ping Cards */}
      <div>
        <h3 className="text-sm font-bold text-[#49352F] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#2E7D5E]" />
          {ap.providerStatusHeading}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerStatuses.map((p) => {
            const ping = pingResults[p.provider];
            return (
              <div
                key={p.provider}
                className="bg-white border border-[#49352F]/15 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#49352F]/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#49352F]">{p.name}</h4>
                      <span className="text-[11px] text-[#49352F]/60 font-mono block">
                        {p.keyPreview || ap.noKeyConfigured}
                      </span>
                    </div>

                    {p.configured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {ap.configuredBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        {ap.unconfiguredBadge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 my-3 text-[11px] text-[#49352F]/80">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#49352F]/60">{ap.capabilitiesLabel}</span>
                      <span className="font-medium text-right capitalize">
                        {p.supportedTasks.map((tItem) => tItem.replace(/_/g, " ")).join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#49352F]/60">{ap.languagesLabel}</span>
                      <span className="font-medium uppercase text-right">
                        {p.supportedLanguages.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#49352F]/10">
                  <button
                    type="button"
                    onClick={() => handleTestPing(p.provider)}
                    disabled={pingingProvider === p.provider}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF6E9] hover:bg-[#F2CAB3]/40 text-[#49352F] border border-[#49352F]/15 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {pingingProvider === p.provider ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{ap.sendingLivePing}</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5 text-[#2E7D5E]" />
                        <span>{ap.testPingBtn}</span>
                      </>
                    )}
                  </button>

                  {ping && (
                    <div
                      className={`mt-2 p-2 rounded-lg text-[11px] leading-tight flex items-start gap-1.5 border ${
                        ping.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-red-50 border-red-200 text-red-900"
                      }`}
                    >
                      {ping.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">
                          {ping.success ? tr("aiProviders.connectedStatus", { ms: ping.latencyMs }) : ap.pingFailedTitle}
                        </div>
                        <div className="text-[10px] opacity-90">{ping.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Task-by-Task Provider Routing Configuration */}
      <div className="bg-white border border-[#49352F]/15 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#49352F] uppercase tracking-wider mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#2E7D5E]" />
          {ap.taskRoutingHeading}
        </h3>
        <p className="text-xs text-[#49352F]/70 mb-4">
          {ap.taskRoutingDesc}
        </p>

        <div className="divide-y divide-[#49352F]/10 border border-[#49352F]/10 rounded-xl overflow-hidden">
          {tasks.map((task) => {
            const config = configs.find((c) => c.task === task) || {
              task,
              primaryProvider: "offline_fallback",
              fallbackProvider: "offline_fallback",
              enabled: true,
            };

            return (
              <div
                key={task}
                className="p-4 bg-white hover:bg-[#FAF6E9]/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="md:w-1/3">
                  <h4 className="text-xs font-bold text-[#49352F]">
                    {TASK_NAMES[task]?.title || task}
                  </h4>
                  <p className="text-[11px] text-[#49352F]/60 mt-0.5">
                    {TASK_NAMES[task]?.desc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:w-2/3 justify-end">
                  {/* Primary Provider */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#49352F]/70 mb-0.5 uppercase tracking-wider">
                      {ap.primaryProviderLabel}
                    </label>
                    <select
                      value={config.primaryProvider}
                      onChange={(e) =>
                        handleConfigChange(task, "primaryProvider", e.target.value as AiProviderName)
                      }
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-[#FAF6E9] border border-[#49352F]/20 text-[#49352F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#F2CAB3]"
                    >
                      <option value="gemini">{ap.optGemini}</option>
                      <option value="openai">{ap.optOpenai}</option>
                      <option value="google_translate">{ap.optGoogleTranslate}</option>
                      <option value="bhashini">{ap.optBhashini}</option>
                      <option value="offline_fallback">{ap.optOffline}</option>
                    </select>
                  </div>

                  {/* Fallback Provider */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#49352F]/70 mb-0.5 uppercase tracking-wider">
                      {ap.fallbackProviderLabel}
                    </label>
                    <select
                      value={config.fallbackProvider || "offline_fallback"}
                      onChange={(e) =>
                        handleConfigChange(task, "fallbackProvider", e.target.value as AiProviderName)
                      }
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-[#FAF6E9] border border-[#49352F]/20 text-[#49352F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#F2CAB3]"
                    >
                      <option value="offline_fallback">{ap.optOffline}</option>
                      <option value="gemini">{ap.optGemini}</option>
                      <option value="openai">{ap.optOpenaiShort}</option>
                      <option value="google_translate">{ap.optGoogleTranslateShort}</option>
                      <option value="bhashini">{ap.optBhashiniShort}</option>
                    </select>
                  </div>

                  {/* Enabled Toggle */}
                  <div className="flex flex-col items-center">
                    <label className="block text-[10px] font-bold text-[#49352F]/70 mb-0.5 uppercase tracking-wider">
                      {ap.statusLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleConfigChange(task, "enabled", !config.enabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        config.enabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-gray-100 text-gray-600 border border-gray-300"
                      }`}
                    >
                      {config.enabled ? ap.activeBtn : ap.disabledBtn}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recent Real AI Telemetry Log Table */}
      {metricsSummary && metricsSummary.recentMetrics.length > 0 && (
        <div className="bg-white border border-[#49352F]/15 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#49352F] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2E7D5E]" />
            {ap.telemetryHeading}
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[#49352F]/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6E9] text-[#49352F] font-bold border-b border-[#49352F]/10">
                <tr>
                  <th className="py-2 px-3">{ap.thTimestamp}</th>
                  <th className="py-2 px-3">{ap.thPipelineTask}</th>
                  <th className="py-2 px-3">{ap.thProvider}</th>
                  <th className="py-2 px-3">{ap.thModel}</th>
                  <th className="py-2 px-3">{ap.thLatency}</th>
                  <th className="py-2 px-3">{ap.thEstCost}</th>
                  <th className="py-2 px-3">{ap.thStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/5 bg-white font-mono text-[11px]">
                {metricsSummary.recentMetrics.slice(0, 10).map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF6E9]/40">
                    <td className="py-2 px-3 text-[#49352F]/70 font-sans">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 capitalize font-sans font-semibold text-[#49352F]">
                      {m.task.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 px-3 uppercase text-[#49352F]">{m.provider}</td>
                    <td className="py-2 px-3 text-[#49352F]/70">{m.model || ap.modelDefaultFallback}</td>
                    <td className="py-2 px-3 text-[#49352F]">{m.latencyMs}ms</td>
                    <td className="py-2 px-3 text-emerald-800">${(m.estimatedCostUsd || 0).toFixed(5)}</td>
                    <td className="py-2 px-3">
                      {m.success ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-sans font-bold">
                          {ap.statusSuccessBadge}
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-sans font-bold">
                          {ap.statusErrorBadge}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
