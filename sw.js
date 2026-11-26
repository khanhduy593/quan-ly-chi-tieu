const C='so-chi-tieu-v1',CFG='so-chi-tieu-cfg';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))))});
/* app gửi địa chỉ Apps Script và mật khẩu để lấy nội dung thông báo khi có tin đẩy */
self.addEventListener('message',e=>{
  const d=e.data;
  if(d&&d.type==='cfg')e.waitUntil(caches.open(CFG).then(c=>c.put('cfg-store',new Response(JSON.stringify(d.cfg)))));
});
function listVi(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' và '+a[a.length-1]}
function groupText(g){
  const p=[];
  if(g.out)p.push(g.out+' khoản cần chi');
  if(g.inn)p.push(g.inn+' khoản thu được nhận');
  if(g.goal)p.push(g.goal+' mục tiêu đến hạn');
  return (g.n===0?'Hôm nay':g.n+' ngày nữa')+' bạn có '+listVi(p);
}
async function showDue(){
  let groups=null,test=false;
  try{
    const c=await caches.open(CFG),r=await c.match('cfg-store');
    if(r){
      const cfg=await r.json();
      const res=await fetch(cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:cfg.key,action:'due'})});
      const j=await res.json();
      if(j&&j.ok&&Array.isArray(j.groups)){groups=j.groups;test=!!j.test}
    }
  }catch(e){}
  let body='Bạn có khoản sắp đến hạn (bấm vào để xem chi tiết)';
  if(groups&&groups.length)body=groups.map(groupText).join('\n')+'\n(bấm vào để xem chi tiết)';
  else if(groups&&test)body='Thông báo từ Sổ Chi Tiêu đã hoạt động.';
  await self.registration.showNotification('Sổ Chi Tiêu',{body,tag:'so-chi-tieu-due',renotify:true});
}
self.addEventListener('push',e=>{e.waitUntil(showDue())});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil((async()=>{
    try{const c=await caches.open(CFG);await c.put('open-bell',new Response(String(Date.now())))}catch(x){}
    const l=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of l){if('focus' in c){c.postMessage({type:'open-bell'});return c.focus()}}
    return self.clients.openWindow(self.registration.scope);
  })());
});
