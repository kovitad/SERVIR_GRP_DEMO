(() => {
  const loginShell = document.querySelector('#loginShell');
  const form = document.querySelector('#loginForm');
  const error = document.querySelector('#loginError');
  const submit = document.querySelector('#loginSubmit');
  const username = document.querySelector('#loginUsername');
  const demoAccess = document.querySelector('#demoAccess');
  const demoPlannerLogin = document.querySelector('#demoPlannerLogin');

  async function request(path, options = {}) {
    const response = await fetch(path,{cache:'no-store',credentials:'same-origin',...options});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function initials(value) {
    const parts=String(value||'User').trim().split(/[\s._-]+/).filter(Boolean);
    return parts.slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'U';
  }

  function showLogin(message='') {
    window.dispatchEvent(new Event('grp-close-transient-ui'));
    window.GRP_AUTH = null;
    document.body.classList.remove('role-admin','role-planner');
    document.body.classList.add('auth-pending');
    loginShell.hidden=false;
    error.textContent=message;
    setTimeout(()=>username.focus(),0);
  }

  function showApplication(user, openDestination=true) {
    window.GRP_AUTH={username:user.username,role:user.role};
    document.body.classList.remove('auth-pending','role-admin','role-planner');
    document.body.classList.add(`role-${user.role}`);
    loginShell.hidden=true;
    document.querySelectorAll('[data-auth-username]').forEach(node=>node.textContent=user.username);
    document.querySelectorAll('[data-auth-role]').forEach(node=>node.textContent=user.role==='admin'?'Administrator':'Planning workspace');
    document.querySelectorAll('[data-auth-initials]').forEach(node=>node.textContent=initials(user.username));
    window.dispatchEvent(new CustomEvent('grp-authenticated',{detail:user}));
    if(openDestination && user.role==='admin') setTimeout(()=>document.querySelector('#aiAssuranceBtn')?.click(),0);
  }

  async function demoLogin() {
    error.textContent='';demoPlannerLogin.disabled=true;demoPlannerLogin.textContent='Opening Planner workspace…';
    try { const data=await request('/api/auth/demo-planner',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});showApplication(data.user,true); }
    catch(failure){showLogin(failure.message);}
    finally{demoPlannerLogin.disabled=false;demoPlannerLogin.textContent='Continue as demo Planner';}
  }

  async function configureDemoAccess() {
    try {
      const data=await request('/api/auth/demo-status');
      demoAccess.hidden=!data.plannerQuickLogin;
      if(data.plannerQuickLogin&&new URLSearchParams(location.search).get('demo')==='planner')await demoLogin();
    } catch { demoAccess.hidden=true; }
  }

  async function restoreSession() {
    try { const data=await request('/api/auth/session'); showApplication(data.user,true); }
    catch { showLogin(); await configureDemoAccess(); }
  }

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    error.textContent=''; submit.disabled=true; submit.textContent='Signing in…';
    const payload={username:form.username.value.trim(),password:form.password.value};
    try {
      const data=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      form.password.value=''; showApplication(data.user,true);
    } catch (failure) { error.textContent=failure.message; form.password.select(); }
    finally { submit.disabled=false; submit.textContent='Sign in securely'; }
  });

  demoPlannerLogin.addEventListener('click',demoLogin);

  document.addEventListener('click',async event=>{
    if(!event.target.closest('[data-auth-logout]')) return;
    try { await request('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); }
    catch { /* Clear the local view even if the server session has expired. */ }
    document.querySelector('#assuranceWorkspace')?.classList.remove('open');
    showLogin('You have signed out.');
  });

  restoreSession();
})();
