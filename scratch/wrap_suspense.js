const fs = require('fs');

// 1. Wrap src/app/parent/dashboard/page.tsx
let dash = fs.readFileSync('src/app/parent/dashboard/page.tsx', 'utf8');
if (!dash.includes('function ParentDashboardContent')) {
  dash = dash.replace(
    'import React, { useState, useEffect } from "react";',
    'import React, { useState, useEffect, Suspense } from "react";'
  );
  dash = dash.replace(
    'export default function ParentDashboardPage() {',
    'function ParentDashboardContent() {'
  );
  dash += `

export default function ParentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white shadow-md text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#49352F]">Loading Parent Portal...</p>
          </div>
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
`;
  fs.writeFileSync('src/app/parent/dashboard/page.tsx', dash, 'utf8');
  console.log('Wrapped src/app/parent/dashboard/page.tsx in Suspense');
}

// 2. Wrap src/app/parent/login/page.tsx
let login = fs.readFileSync('src/app/parent/login/page.tsx', 'utf8');
if (!login.includes('function ParentLoginContent')) {
  login = login.replace(
    'import React, { useState, useEffect } from "react";',
    'import React, { useState, useEffect, Suspense } from "react";'
  );
  login = login.replace(
    'export default function ParentLoginPage() {',
    'function ParentLoginContent() {'
  );
  login += `

export default function ParentLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white shadow-md text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#49352F]">Loading Parent Login...</p>
          </div>
        </div>
      }
    >
      <ParentLoginContent />
    </Suspense>
  );
}
`;
  fs.writeFileSync('src/app/parent/login/page.tsx', login, 'utf8');
  console.log('Wrapped src/app/parent/login/page.tsx in Suspense');
}

