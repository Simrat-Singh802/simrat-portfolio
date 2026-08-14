
const toast=document.getElementById('toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)}
const ghBtn=document.getElementById('ghLoadBtn');
if(ghBtn){
 const input=document.getElementById('ghUsername'),status=document.getElementById('ghStatus'),grid=document.getElementById('repoGrid');
 function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
 async function loadRepos(username){
  if(!username){status.textContent='Enter a GitHub username above.';return}
  status.textContent='Loading repositories…';grid.innerHTML='';
  try{
   const res=await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=12`);
   if(!res.ok){status.textContent=res.status===404?`No GitHub user found for "${username}".`:`GitHub API error (${res.status}).`;return}
   const repos=await res.json(); if(!repos.length){status.textContent='No public repositories found.';return}
   status.textContent=`${repos.length} repositories for ${username}`;
   grid.innerHTML=repos.map(r=>`<a class="repo-card" href="${r.html_url}" target="_blank" rel="noopener"><div class="repo-name">${esc(r.name)}</div><div class="repo-desc">${esc(r.description||'No description provided.')}</div><div class="repo-meta">${r.language?`<span>${esc(r.language)}</span>`:''}<span>★ ${r.stargazers_count}</span><span>updated ${new Date(r.updated_at).toLocaleDateString()}</span></div></a>`).join('');
   localStorage.setItem('githubUsername',username);
  }catch(e){status.textContent='Could not reach GitHub right now.'}
 }
 ghBtn.addEventListener('click',()=>loadRepos(input.value.trim()));
 input.addEventListener('keydown',e=>{if(e.key==='Enter')loadRepos(input.value.trim())});
 const saved=localStorage.getItem('githubUsername');if(saved){input.value=saved;loadRepos(saved)}
}
const box=document.getElementById('resumeBox');
if(box){
 function empty(){
  box.innerHTML=`<div class="dropzone" id="dropzone"><div class="dz-title mono">Drop your resume here</div><div class="dz-sub">or click to browse · PDF only</div></div><input type="file" id="resumeInput" accept="application/pdf">`;attach()
 }
 function loaded(name,size,dataUrl){
  box.innerHTML=`<div class="resume-loaded"><div class="resume-icon">PDF</div><div class="resume-info"><div class="fname">${esc(name)}</div><div class="fmeta">${(size/1024).toFixed(0)} KB</div></div><div class="resume-actions"><a class="btn primary" href="${dataUrl}" target="_blank">View</a><a class="btn" href="${dataUrl}" download="${esc(name)}">Download</a><button class="btn" id="replaceResumeBtn">Replace</button></div></div>`;
  document.getElementById('replaceResumeBtn').onclick=empty
 }
 function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
 function handle(file){
  if(!file)return;if(file.type!=='application/pdf'){showToast('Please upload a PDF file.');return}
  if(file.size>4.5*1024*1024){showToast('Keep the resume under 4.5 MB.');return}
  const reader=new FileReader();reader.onload=()=>{loaded(file.name,file.size,reader.result);try{localStorage.setItem('resumeFile',JSON.stringify({name:file.name,size:file.size,dataUrl:reader.result}));showToast('Resume saved in this browser.')}catch(e){showToast('Resume loaded, but could not be saved.')}};
  reader.readAsDataURL(file)
 }
 function attach(){
  const dz=document.getElementById('dropzone'),input=document.getElementById('resumeInput');if(!dz||!input)return;
  dz.onclick=()=>input.click();input.onchange=e=>handle(e.target.files[0]);
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag')};dz.ondragleave=()=>dz.classList.remove('drag');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag');handle(e.dataTransfer.files[0])}
 }
 attach();const saved=localStorage.getItem('resumeFile');if(saved){try{const r=JSON.parse(saved);loaded(r.name,r.size,r.dataUrl)}catch(e){}}
}
