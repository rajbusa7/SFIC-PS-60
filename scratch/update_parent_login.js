const fs = require('fs');
let content = fs.readFileSync('src/app/parent/login/page.tsx', 'utf8');
if (!content.includes('demoParam === "true"')) {
  content = content.replace(
    'const errorParam = searchParams.get("error");',
    `const errorParam = searchParams.get("error");
    const demoParam = searchParams.get("demo");
    if (demoParam === "true") {
      setEmail("dinesh.patel@example.com");
      setPassword("DemoParent2026!");
    }`
  );
  fs.writeFileSync('src/app/parent/login/page.tsx', content, 'utf8');
  console.log('Updated src/app/parent/login/page.tsx with demo prefill');
} else {
  console.log('Already updated');
}

