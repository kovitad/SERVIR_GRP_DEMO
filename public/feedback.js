(() => {
  const form=document.querySelector('#feedbackForm');
  const modal=document.querySelector('#feedbackModal');
  const inboxModal=document.querySelector('#feedbackInboxModal');
  const message=document.querySelector('#feedbackMessage');
  const progress=document.querySelector('#feedbackProgress');
  const progressBar=progress.querySelector('i');
  const submit=document.querySelector('#feedbackSubmit');
  const inbox=document.querySelector('#feedbackInbox');
  const summary=document.querySelector('#feedbackInboxSummary');

  function closeAll(){
    document.querySelectorAll('.modal').forEach(item=>{item.classList.remove('open');item.setAttribute('aria-hidden','true');});
  }
  function open(item){closeAll();item.classList.add('open');item.setAttribute('aria-hidden','false');}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
  function readableCategory(value){return ({question:'Question',suggestion:'Suggestion / feature request',problem:'Problem / usability issue','data-correction':'Data or evidence correction',comment:'Comment',compliment:'Compliment',other:'Other'})[value]||value;}
  function readableStatus(value){return ({new:'New',reviewed:'Reviewed','follow-up':'Follow-up',closed:'Closed'})[value]||value;}
  function formatSize(value){return value<1024?`${value} B`:`${Math.ceil(value/1024)} KB`;}
  function filePayload(file){
    return new Promise((resolve,reject)=>{
      if(!file||!file.name)return resolve(null);
      if(file.size>1024*1024)return reject(new Error('Attachment must be 1 MB or smaller.'));
      const allowed=['image/png','image/jpeg','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if(!allowed.includes(file.type)&&!/.docx$/i.test(file.name))return reject(new Error('Use a PNG, JPG, WebP or DOCX file.'));
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('The attachment could not be read.'));
      reader.onload=()=>resolve({name:file.name,type:file.type,size:file.size,data:String(reader.result).split(',')[1]||''});
      reader.readAsDataURL(file);
    });
  }
  function send(payload){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('POST','/api/feedback');xhr.setRequestHeader('Content-Type','application/json');xhr.withCredentials=true;
      xhr.upload.onprogress=event=>{if(event.lengthComputable)progressBar.style.width=`${Math.round(event.loaded/event.total*100)}%`;};
      xhr.onload=()=>{let data={};try{data=JSON.parse(xhr.responseText||'{}');}catch{}xhr.status>=200&&xhr.status<300?resolve(data):reject(new Error(data.error||`HTTP ${xhr.status}`));};
      xhr.onerror=()=>reject(new Error('The feedback service could not be reached.'));
      xhr.send(JSON.stringify(payload));
    });
  }
  async function submitFeedback(event){
    event.preventDefault();message.className='feedback-message';message.textContent='';submit.disabled=true;progress.hidden=false;progressBar.style.width='5%';
    try{
      const data=new FormData(form), attachment=await filePayload(data.get('attachment'));
      const result=await send({name:data.get('name'),hub:data.get('hub'),category:data.get('category'),message:data.get('message'),documentUrl:data.get('documentUrl'),attachment});
      progressBar.style.width='100%';message.className='feedback-message success';message.textContent=`Thank you. Your feedback reference is ${result.reference}.`;
      form.reset();
    }catch(error){message.className='feedback-message error';message.textContent=error.message;}
    finally{submit.disabled=false;setTimeout(()=>{progress.hidden=true;progressBar.style.width='0';},500);}
  }
  async function request(path,options={}){
    const response=await fetch(path,{cache:'no-store',credentials:'same-origin',...options});const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);return data;
  }
  function renderInbox(items){
    summary.textContent=`${items.length} submission${items.length===1?'':'s'} · newest first`;
    if(!items.length){inbox.innerHTML='<div class="feedback-empty">No feedback has been submitted yet.</div>';return;}
    inbox.innerHTML=items.map(item=>`<article class="feedback-item" data-feedback-id="${escapeHtml(item.id)}"><header><div><b>${escapeHtml(item.reference)}</b><span>${escapeHtml(new Date(item.submittedAt).toLocaleString())}</span></div><select aria-label="Feedback status"><option value="new" ${item.status==='new'?'selected':''}>New</option><option value="reviewed" ${item.status==='reviewed'?'selected':''}>Reviewed</option><option value="follow-up" ${item.status==='follow-up'?'selected':''}>Follow-up</option><option value="closed" ${item.status==='closed'?'selected':''}>Closed</option></select></header><div class="feedback-tags"><span>${escapeHtml(item.hub)}</span><span>${escapeHtml(readableCategory(item.category))}</span><span>${escapeHtml(item.name)}</span></div>${item.message?`<p>${escapeHtml(item.message)}</p>`:''}<footer>${item.documentUrl?`<a href="${escapeHtml(item.documentUrl)}" target="_blank" rel="noopener noreferrer">Open document link ↗</a>`:''}${item.attachment?`<a href="${escapeHtml(item.attachment.url)}" download>Download ${escapeHtml(item.attachment.name)} · ${formatSize(item.attachment.size)}</a>`:''}<small>Submitted by ${escapeHtml(item.submittedBy)} · ${escapeHtml(readableStatus(item.status))}</small></footer></article>`).join('');
  }
  async function openInbox(){
    if(window.GRP_AUTH?.role!=='admin')return;
    open(inboxModal);summary.textContent='Loading feedback…';inbox.innerHTML='';
    try{const data=await request('/api/admin/feedback');renderInbox(data.items||[]);}catch(error){summary.textContent='Could not load feedback';inbox.innerHTML=`<div class="feedback-empty error">${escapeHtml(error.message)}</div>`;}
  }

  form.addEventListener('submit',submitFeedback);
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-feedback-open]')){message.textContent='';open(modal);setTimeout(()=>form.elements.name.focus(),0);}
    if(event.target.closest('[data-feedback-inbox]'))openInbox();
  });
  inbox.addEventListener('change',async event=>{
    const select=event.target.closest('select');if(!select)return;
    const article=select.closest('[data-feedback-id]');select.disabled=true;
    try{await request('/api/admin/feedback/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:article.dataset.feedbackId,status:select.value})});article.querySelector('footer small').textContent=article.querySelector('footer small').textContent.replace(/ · [^·]+$/,` · ${readableStatus(select.value)}`);}
    catch(error){alert(error.message);await openInbox();}finally{select.disabled=false;}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(modal.classList.contains('open')||inboxModal.classList.contains('open')))closeAll();},true);
})();
