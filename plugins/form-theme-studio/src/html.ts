import type { Form, FormField } from '@line-harness/sdk'
import { themes, type ThemePreset } from './themes'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderOptions(field: FormField, inputType: 'radio' | 'checkbox'): string {
  return (field.options ?? []).map((option, index) => {
    const id = `field-${escapeHtml(field.name)}-${index}`
    return `<label class="choice" for="${id}">
      <input id="${id}" type="${inputType}" name="${escapeHtml(field.name)}" value="${escapeHtml(option)}" ${field.required && inputType === 'radio' ? 'required' : ''}>
      <span>${escapeHtml(option)}</span>
    </label>`
  }).join('')
}

export function renderField(field: FormField): string {
  const name = escapeHtml(field.name)
  const id = `field-${name}`
  const required = field.required ? 'required' : ''
  const requiredMark = field.required ? '<em>必須</em>' : ''
  const placeholder = escapeHtml(field.placeholder ?? '')

  let control = ''
  if (field.type === 'textarea') {
    control = `<textarea id="${id}" name="${name}" rows="5" placeholder="${placeholder}" ${required}></textarea>`
  } else if (field.type === 'select') {
    const options = (field.options ?? []).map(option =>
      `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
    ).join('')
    control = `<select id="${id}" name="${name}" ${required}><option value="">選択してください</option>${options}</select>`
  } else if (field.type === 'radio' || field.type === 'checkbox') {
    control = `<div class="choices">${renderOptions(field, field.type)}</div>`
  } else {
    const safeType = ['text', 'email', 'tel', 'number', 'date'].includes(field.type) ? field.type : 'text'
    control = `<input id="${id}" type="${safeType}" name="${name}" placeholder="${placeholder}" ${required}>`
  }

  return `<div class="field">
    <label class="label" for="${id}"><span>${escapeHtml(field.label)}</span>${requiredMark}</label>
    ${control}
  </div>`
}

function themeCss(theme: ThemePreset): string {
  const c = theme.colors
  return `:root{
    --page:${c.page};--surface:${c.surface};--text:${c.text};--muted:${c.muted};
    --primary:${c.primary};--primary-hover:${c.primaryHover};--border:${c.border};
    --focus:${c.focus};--radius:${theme.radius};--font:${theme.font};
  }`
}

function baseCss(): string {
  return `*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:var(--page);color:var(--text);font-family:var(--font);line-height:1.7;-webkit-font-smoothing:antialiased}
  button,input,select,textarea{font:inherit}button{cursor:pointer}.shell{width:min(100% - 32px,720px);margin:0 auto;padding:44px 0 72px}
  .brand{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.08em}
  .brand b{display:flex;align-items:center;gap:9px;color:var(--text);font-size:14px}.brand i{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--primary);color:#fff;font-style:normal}
  .theme-switch{display:flex;align-items:center;gap:8px}.theme-switch select{width:auto;padding:8px 32px 8px 10px;border-radius:999px;font-size:12px}
  .card{overflow:hidden;border:1px solid var(--border);border-radius:calc(var(--radius) + 6px);background:var(--surface);box-shadow:0 24px 80px color-mix(in srgb,var(--text) 9%,transparent)}
  .hero{padding:38px 38px 28px;background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 14%,var(--surface)),var(--surface))}
  .eyebrow{margin:0 0 12px;color:var(--primary);font-size:11px;font-weight:800;letter-spacing:.14em}.hero h1{margin:0;font-size:clamp(28px,6vw,42px);line-height:1.25;letter-spacing:-.035em}
  .description{margin:16px 0 0;color:var(--muted);font-size:14px}.form-body{padding:34px 38px 40px}.field{margin-bottom:25px}.label{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;font-size:14px;font-weight:700}
  .label em{border-radius:999px;background:color-mix(in srgb,var(--primary) 13%,var(--surface));padding:3px 8px;color:var(--primary);font-size:9px;font-style:normal}
  input,select,textarea{width:100%;border:1px solid var(--border);border-radius:var(--radius);outline:none;background:var(--surface);color:var(--text);padding:13px 14px;transition:border-color .2s,box-shadow .2s}
  textarea{resize:vertical}input:focus,select:focus,textarea:focus{border-color:var(--focus);box-shadow:0 0 0 3px color-mix(in srgb,var(--focus) 15%,transparent)}
  .choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.choice{position:relative}.choice input{position:absolute;opacity:0}.choice span{display:block;border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;color:var(--muted);font-size:13px;font-weight:600}
  .choice input:checked+span{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 11%,var(--surface));color:var(--primary)}
  .submit{display:flex;align-items:center;justify-content:center;width:100%;min-height:56px;border:0;border-radius:var(--radius);background:var(--primary);color:#fff;font-weight:800;box-shadow:0 12px 28px color-mix(in srgb,var(--primary) 25%,transparent);transition:transform .2s,background .2s}
  .submit:hover{background:var(--primary-hover);transform:translateY(-1px)}.submit:disabled{cursor:wait;opacity:.65;transform:none}
  .status{min-height:24px;margin:14px 0 0;text-align:center;color:var(--muted);font-size:12px}.status.error{color:#c2414a}.status.success{color:var(--focus);font-weight:700}
  .privacy{margin:24px 0 0;text-align:center;color:var(--muted);font-size:10px}.success-box{padding:54px 38px;text-align:center}.success-icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 22px;border-radius:50%;background:color-mix(in srgb,var(--primary) 14%,var(--surface));color:var(--primary);font-size:26px;font-weight:900}
  .success-box h2{margin:0;font-size:28px}.success-box p{color:var(--muted)}.footer{margin-top:20px;text-align:center;color:var(--muted);font-size:10px}
  @media(max-width:560px){.shell{padding-top:24px}.brand{align-items:flex-start;gap:14px}.theme-switch{align-items:flex-end;flex-direction:column}.card{border-radius:var(--radius)}.hero,.form-body{padding-left:22px;padding-right:22px}.choices{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}`
}

function clientScript(liffId: string): string {
  const safeLiffId = JSON.stringify(liffId).replaceAll('<', '\\u003c')
  return `const liffId=${safeLiffId};
  const form=document.getElementById('theme-form');
  const statusEl=document.getElementById('status');
  const submitButton=document.getElementById('submit-button');
  const themeSelect=document.getElementById('theme-select');
  themeSelect.addEventListener('change',()=>{
    const url=new URL(location.href);url.searchParams.set('theme',themeSelect.value);location.href=url.toString();
  });
  let liffReady=false;
  async function initLiff(){
    try{
      await liff.init({liffId});
      liffReady=true;
      statusEl.textContent=liff.isLoggedIn()?'LINE認証済みです':'送信時にLINEログインします';
    }catch{
      statusEl.textContent='LINEから開くと回答を送信できます';
    }
  }
  initLiff();
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    statusEl.className='status';
    if(!liffReady){statusEl.textContent='LINEから開いてください';statusEl.classList.add('error');return}
    if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return}
    const idToken=liff.getIDToken();
    if(!idToken){statusEl.textContent='LINE認証を確認できませんでした';statusEl.classList.add('error');return}
    const values={};
    for(const [key,value] of new FormData(form).entries()){
      if(Object.hasOwn(values,key)){values[key]=Array.isArray(values[key])?[...values[key],value]:[values[key],value]}
      else values[key]=value;
    }
    submitButton.disabled=true;submitButton.textContent='送信しています…';
    try{
      const response=await fetch(form.action,{
        method:'POST',
        headers:{'Authorization':'Bearer '+idToken,'Content-Type':'application/json'},
        body:JSON.stringify({data:values})
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.success===false)throw new Error(result.error||'送信できませんでした');
      document.querySelector('.card').innerHTML='<div class="success-box"><div class="success-icon">✓</div><h2>回答を受け付けました</h2><p>LINEへ戻って、次のご案内をお待ちください。</p></div>';
    }catch(error){
      statusEl.textContent=error instanceof Error?error.message:'送信できませんでした';
      statusEl.classList.add('error');submitButton.disabled=false;submitButton.textContent='回答を送信する';
    }
  });`
}

export function renderFormPage(form: Form, theme: ThemePreset, liffId: string, nonce: string): string {
  const themeOptions = themes.map(item =>
    `<option value="${item.id}" ${item.id === theme.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`
  ).join('')
  const fields = form.fields.map(renderField).join('')
  return `<!doctype html>
  <html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>${escapeHtml(form.name)} | LineHarness Form Theme Studio</title>
  <script nonce="${nonce}" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
  <style nonce="${nonce}">${themeCss(theme)}${baseCss()}</style></head>
  <body><main class="shell"><header class="brand"><b><i>L</i> LineHarness Form</b><label class="theme-switch">テーマ<select id="theme-select">${themeOptions}</select></label></header>
  <section class="card"><div class="hero"><p class="eyebrow">${escapeHtml(theme.name).toUpperCase()}</p><h1>${escapeHtml(form.name)}</h1>
  ${form.description ? `<p class="description">${escapeHtml(form.description)}</p>` : ''}</div>
  <form id="theme-form" class="form-body" action="/api/forms/${encodeURIComponent(form.id)}/submit">${fields}
  <button id="submit-button" class="submit" type="submit">回答を送信する</button><p id="status" class="status">LINEとの接続を確認しています…</p>
  <p class="privacy">回答はLineHarnessへ直接保存され、このテーマWorkerには保持されません。</p></form></section>
  <p class="footer">Powered by LineHarness Form Theme Studio</p></main>
  <script nonce="${nonce}">${clientScript(liffId)}</script></body></html>`
}

export function renderLandingPage(defaultTheme: ThemePreset, nonce: string): string {
  const swatchCss = themes.map(theme =>
    `.swatch-${theme.id}-primary{background:${theme.colors.primary}}.swatch-${theme.id}-page{background:${theme.colors.page}}.swatch-${theme.id}-text{background:${theme.colors.text}}`
  ).join('')
  const cards = themes.map(theme => `<article><div class="swatches"><i class="swatch-${theme.id}-primary"></i><i class="swatch-${theme.id}-page"></i><i class="swatch-${theme.id}-text"></i></div><h2>${escapeHtml(theme.name)}</h2><p>${escapeHtml(theme.description)}</p><code>?theme=${theme.id}</code></article>`).join('')
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LineHarness Form Theme Studio</title>
  <style nonce="${nonce}">${themeCss(defaultTheme)}${baseCss()}${swatchCss}.intro{margin-bottom:34px}.intro h1{margin:0;font-size:clamp(36px,8vw,64px);line-height:1.12;letter-spacing:-.05em}.intro h1 span{color:var(--primary)}.intro p{max-width:590px;color:var(--muted)}.theme-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.theme-cards article{padding:22px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.theme-cards h2{margin:15px 0 4px;font-size:17px}.theme-cards p{min-height:48px;margin:0;color:var(--muted);font-size:12px}.theme-cards code{display:inline-block;margin-top:14px;color:var(--primary);font-size:11px}.swatches{display:flex;gap:6px}.swatches i{width:30px;height:30px;border:1px solid var(--border);border-radius:9px}@media(max-width:560px){.theme-cards{grid-template-columns:1fr}}</style></head>
  <body><main class="shell"><div class="intro"><p class="eyebrow">LINEHARNESS PLUGIN</p><h1>フォームを、<br><span>ブランドの顔</span>に。</h1><p>LineHarnessのフォーム内容と配信フローはそのまま。URLにテーマ名を指定するだけで、回答画面の印象を切り替えます。</p></div>
  <section class="theme-cards">${cards}</section><p class="footer">表示例: /form/{formId}?theme=ocean</p></main></body></html>`
}
