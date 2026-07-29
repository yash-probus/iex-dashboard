import React from 'react';

export const Dashboard: React.FC = () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Delhi Flour Mills | Energy Savings Dashboard</title>
<style>
:root{--ink:#10233f;--muted:#617089;--paper:#f4f7fb;--card:#ffffff;--navy:#0a2540;--blue:#1769e0;--cyan:#00a7c4;--green:#1e9c68;--green-dark:#13734c;--amber:#f3aa24;--red:#d45d5d;--line:#dde5ef;--shadow:0 14px 36px rgba(15,39,70,.08);}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
button,select,input{font:inherit}
.shell{max-width:1480px;margin:auto;padding:24px}
.hero{position:relative;overflow:hidden;border-radius:24px;padding:30px 32px;color:#fff;background:linear-gradient(120deg,#071b32 0%,#0c3156 58%,#07584b 120%);box-shadow:var(--shadow)}
.hero:after{content:"";position:abs}
</style>
</head>
<body>
<!-- Dashboard content goes here -->
</body>
</html>`;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
