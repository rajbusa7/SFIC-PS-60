"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Users, MessageSquare, Search, Shield, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Contact {
  userId: string;
  name: string;
  role: string;
  title: string;
  subtitle: string;
  studentId?: string;
  studentName?: string;
  grade?: number;
  section?: string;
  classroomId?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  onSelectContact: (contact: Contact) => void;
  onCreateGroup: (groupData: {
    title: string;
    description: string;
    classroomId?: string;
    grade?: number;
    section?: string;
    participantIds: string[];
    allowParentReplies: boolean;
  }) => Promise<void>;
}

export function NewChatModal({
  isOpen,
  onClose,
  currentUserRole,
  onSelectContact,
  onCreateGroup,
}: NewChatModalProps) {
  const { language } = useLanguage();
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Group creation form state
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedClass, setSelectedClass] = useState("cls-4a");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [allowReplies, setAllowReplies] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/connect/contacts")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setContacts(d.contacts || []);
        }
      })
      .catch((e) => console.error("Error loading contacts:", e))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleParticipant = (uid: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    setSubmitting(true);
    try {
      const gradeNum = parseInt(selectedClass.replace(/[^0-9]/g, ""), 10) || 4;
      await onCreateGroup({
        title: groupTitle.trim(),
        description: groupDesc.trim(),
        classroomId: selectedClass,
        grade: gradeNum,
        section: "A",
        participantIds: selectedParticipants,
        allowParentReplies: allowReplies,
      });
      onClose();
    } catch (err) {
      console.error("Group creation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F2] dark:bg-[#201A17] border border-[#49352F]/20 dark:border-[#F4F1E1]/15 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-[#F4F1E1] dark:bg-[#261E1A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2E7D5E] text-white flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-[#49352F] dark:text-[#F4F1E1]">
              {language === "gu" ? "નવો વાર્તાલાપ શરૂ કરો" : "Start New Conversation"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#49352F]/60 dark:text-[#F4F1E1]/60 hover:bg-[#49352F]/10 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-white/50 dark:bg-[#1B1614]/50">
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition ${
              tab === "direct"
                ? "border-[#2E7D5E] text-[#2E7D5E] bg-white/80 dark:bg-[#261E1A]"
                : "border-transparent text-[#49352F]/60 dark:text-[#F4F1E1]/60 hover:text-[#49352F]"
            }`}
          >
            {language === "gu" ? "૧-થી-૧ ખાનગી ચેટ" : "1-on-1 Direct Chat"}
          </button>
          {currentUserRole !== "parent" && (
            <button
              onClick={() => setTab("group")}
              className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition ${
                tab === "group"
                  ? "border-[#2E7D5E] text-[#2E7D5E] bg-white/80 dark:bg-[#261E1A]"
                  : "border-transparent text-[#49352F]/60 dark:text-[#F4F1E1]/60 hover:text-[#49352F]"
              }`}
            >
              {language === "gu" ? "નવું વર્ગ જૂથ બનાવો" : "Create Class Group"}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "direct" ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#49352F]/40 dark:text-[#F4F1E1]/40" />
                <input
                  type="text"
                  placeholder={language === "gu" ? "શિક્ષક અથવા વાલી શોધો..." : "Search teacher or parent..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 bg-white dark:bg-[#261E1A] text-[#49352F] dark:text-[#F4F1E1] focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30"
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#49352F]/60">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2E7D5E] mb-2" />
                  <span className="text-xs">{language === "gu" ? "સંપર્કો લોડ થઈ રહ્યા છે..." : "Loading contacts..."}</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-10 text-[#49352F]/50 text-sm">
                  {language === "gu" ? "કોઈ સંપર્ક મળ્યો નથી." : "No authorized contacts found."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.userId}
                      onClick={() => {
                        onSelectContact(contact);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-white dark:bg-[#261E1A] hover:border-[#2E7D5E] hover:bg-[#F4F1E1]/60 dark:hover:bg-[#322823] cursor-pointer transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F2CAB3] dark:bg-[#49352F] text-[#49352F] dark:text-[#F4F1E1] font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-[#49352F] dark:text-[#F4F1E1] truncate">
                            {contact.title}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#2E7D5E]/10 text-[#2E7D5E]">
                            {contact.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#49352F]/60 dark:text-[#F4F1E1]/60 truncate">
                          {contact.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Create Group Form */
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "જૂથનું નામ *" : "Group Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 4A — Parents & Teacher"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#49352F]/20 dark:border-[#F4F1E1]/20 bg-white dark:bg-[#261E1A] text-[#49352F] dark:text-[#F4F1E1] focus:ring-2 focus:ring-[#2E7D5E]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "સંબંધિત વર્ગ *" : "Associated Class *"}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#49352F]/20 dark:border-[#F4F1E1]/20 bg-white dark:bg-[#261E1A] text-[#49352F] dark:text-[#F4F1E1]"
                >
                  <option value="cls-1a">Class 1A (Grade 1)</option>
                  <option value="cls-2a">Class 2A (Grade 2)</option>
                  <option value="cls-3a">Class 3A (Grade 3)</option>
                  <option value="cls-4a">Class 4A (Grade 4)</option>
                  <option value="cls-5a">Class 5A (Grade 5)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "વિગત / હેતુ" : "Description / Goal"}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily homework updates, worksheet distribution, and classroom reminders."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#49352F]/20 dark:border-[#F4F1E1]/20 bg-white dark:bg-[#261E1A] text-[#49352F] dark:text-[#F4F1E1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mb-2">
                  {language === "gu" ? "વાલી સભ્યો પસંદ કરો" : "Select Authorized Parents"}
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-[#49352F]/10 dark:border-[#F4F1E1]/10 p-2 rounded-xl bg-white dark:bg-[#261E1A]">
                  {contacts
                    .filter((c) => c.role === "parent")
                    .map((p) => {
                      const isChecked = selectedParticipants.includes(p.userId);
                      return (
                        <div
                          key={p.userId}
                          onClick={() => handleToggleParticipant(p.userId)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                            isChecked
                              ? "bg-[#2E7D5E]/15 text-[#2E7D5E] font-semibold"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-[#49352F] dark:text-[#F4F1E1]"
                          }`}
                        >
                          <div>
                            <div>{p.name}</div>
                            <div className="text-[10px] text-gray-500">{p.subtitle}</div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? "bg-[#2E7D5E] border-[#2E7D5E] text-white" : "border-gray-400"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowReplies"
                  checked={allowReplies}
                  onChange={(e) => setAllowReplies(e.target.checked)}
                  className="rounded text-[#2E7D5E] focus:ring-[#2E7D5E]"
                />
                <label htmlFor="allowReplies" className="text-xs text-[#49352F] dark:text-[#F4F1E1]">
                  {language === "gu"
                    ? "વાલીઓને મેસેજનો જવાબ આપવાની પરવાનગી આપો"
                    : "Allow parents to post replies in this group"}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !groupTitle.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#2E7D5E] hover:bg-[#24634B] text-white font-bold text-sm shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {language === "gu" ? "વર્ગ જૂથ બનાવો" : "Create Class Group"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
