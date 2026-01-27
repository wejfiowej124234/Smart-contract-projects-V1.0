// Auto-generate PDF from HTML using puppeteer
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'slides', 'dist');

// Find browser
const browserPaths = [
  process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.ProgramFiles + '\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.ProgramFiles + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env['ProgramFiles(x86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];

let browserPath = null;
for (const path of browserPaths) {
  if (existsSync(path)) {
    browserPath = path;
    break;
  }
}

if (!browserPath) {
  console.error('Browser not found. Please install Chrome/Edge.');
  process.exit(1);
}

console.log(`Found browser: ${browserPath}`);

// Generate Chinese PDF
const zhHtml = join(distDir, 'INTERVIEW_DECK.zh-cn.html');
const zhPdf = join(distDir, 'INTERVIEW_DECK.zh-cn.pdf');

if (existsSync(zhHtml)) {
  console.log('Generating Chinese PDF...');
  const zhUri = `file:///${zhHtml.replace(/\\/g, '/')}`;
  const cmd = `"${browserPath}" --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --disable-crash-reporter --print-to-pdf="${zhPdf}" --print-to-pdf-no-header "${zhUri}"`;
  
  try {
    await execAsync(cmd, { timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (existsSync(zhPdf)) {
      console.log(`✓ Chinese PDF generated: ${zhPdf}`);
    } else {
      console.error('✗ Chinese PDF generation failed');
    }
  } catch (error) {
    console.error('Error generating Chinese PDF:', error.message);
  }
}

// Generate English PDF
const enHtml = join(distDir, 'INTERVIEW_DECK.en.html');
const enPdf = join(distDir, 'INTERVIEW_DECK.en.pdf');

if (existsSync(enHtml)) {
  console.log('Generating English PDF...');
  const enUri = `file:///${enHtml.replace(/\\/g, '/')}`;
  const cmd = `"${browserPath}" --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --disable-crash-reporter --print-to-pdf="${enPdf}" --print-to-pdf-no-header "${enUri}"`;
  
  try {
    await execAsync(cmd, { timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (existsSync(enPdf)) {
      console.log(`✓ English PDF generated: ${enPdf}`);
    } else {
      console.error('✗ English PDF generation failed');
    }
  } catch (error) {
    console.error('Error generating English PDF:', error.message);
  }
}

console.log('Done!');
