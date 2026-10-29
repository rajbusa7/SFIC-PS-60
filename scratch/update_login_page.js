const fs = require('fs');

let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// 1. Destructure loginAsDemoParent
content = content.replace(
  'const { login, registerTeacher, loginAsDemoTeacher, loginAsDemoAdmin } = useAuth();',
  'const { login, registerTeacher, loginAsDemoTeacher, loginAsDemoAdmin, loginAsDemoParent } = useAuth();'
);

// 2. Add handleParentDemo
if (!content.includes('handleParentDemo')) {
  content = content.replace(
    '  const handleTeacherDemo = async () => {',
    `  const handleParentDemo = async () => {
    await loginAsDemoParent();
    router.push("/parent/dashboard");
  };

  const handleTeacherDemo = async () => {`
  );
}

// 3. Update tabs switcher
const oldTabs = `<div className="inline-flex p-1 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/20">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setBannerNotice(null);
              }}
              className={\`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                authMode === "login"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }\`}
            >
              {language === "gu" ? "શિક્ષક પ્રવેશ (Sign In)" : "Teacher Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setBannerNotice(null);
              }}
              className={\`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                authMode === "register"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }\`}
            >
              {language === "gu" ? "નવું એકાઉન્ટ (Register)" : "Create Account"}
            </button>
          </div>`;

const newTabs = `<div className="inline-flex p-1 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/20">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setBannerNotice(null);
              }}
              className={\`px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                authMode === "login"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }\`}
            >
              {language === "gu" ? "શિક્ષક પ્રવેશ" : "Teacher Login"}
            </button>
            <Link
              href="/parent/login"
              className="px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-[#F2CAB3]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
              <span>{language === "gu" ? "વાલી પ્રવેશ" : "Parent Login"}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setBannerNotice(null);
              }}
              className={\`px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                authMode === "register"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }\`}
            >
              {language === "gu" ? "નવું એકાઉન્ટ" : "Create Account"}
            </button>
          </div>`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\\r\\n/g, '\\n');
const normalizedOldTabs = oldTabs.replace(/\\r\\n/g, '\\n');

if (normalizedContent.includes(normalizedOldTabs)) {
  content = normalizedContent.replace(normalizedOldTabs, newTabs);
} else {
  console.log("Could not find old tabs directly, searching...");
}

// 4. Update 1-Click Access buttons to 3 roles
const oldRoles = `<div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                type="button"
                variant="saffron"
                size="sm"
                onClick={handleTeacherDemo}
                className="rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                <span>{language === "gu" ? "શિક્ષક ભૂમિકા" : "Teacher Role"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdminDemo}
                className="rounded-xl text-xs font-bold border-[#49352F]/15 dark:border-[#F2CAB3]/30 hover:border-[#49352F]/30 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span>{language === "gu" ? "પ્રશાસક ભૂમિકા" : "Admin Role"}</span>
              </Button>
            </div>`;

const newRoles = `<div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                type="button"
                variant="saffron"
                size="sm"
                onClick={handleTeacherDemo}
                className="rounded-xl text-xs font-black shadow-xs cursor-pointer px-2"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span className="truncate">{language === "gu" ? "શિક્ષક" : "Teacher Role"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParentDemo}
                className="rounded-xl text-xs font-bold border-[#B26A1B]/40 hover:border-[#B26A1B] bg-[#F2CAB3]/25 hover:bg-[#F2CAB3]/50 text-[#49352F] dark:text-[#F4F1E1] cursor-pointer px-2"
              >
                <Users className="w-3.5 h-3.5 mr-1 shrink-0 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span className="truncate">{language === "gu" ? "વાલી" : "Parent Role"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdminDemo}
                className="rounded-xl text-xs font-bold border-[#49352F]/15 dark:border-[#F2CAB3]/30 hover:border-[#49352F]/30 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] cursor-pointer px-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 shrink-0 text-[#7A6862] dark:text-[#FAF6E9]" />
                <span className="truncate">{language === "gu" ? "પ્રશાસક" : "Admin Role"}</span>
              </Button>
            </div>`;

const normalizedOldRoles = oldRoles.replace(/\\r\\n/g, '\\n');
if (content.includes(normalizedOldRoles)) {
  content = content.replace(normalizedOldRoles, newRoles);
} else {
  console.log("Could not find old roles directly, searching...");
}

fs.writeFileSync('src/app/login/page.tsx', content, 'utf8');
console.log('Successfully updated src/app/login/page.tsx');

