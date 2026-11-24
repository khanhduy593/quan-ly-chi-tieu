const C='so-chi-tieu-v1',CFG='so-chi-tieu-cfg';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))))});
/* app gửi địa chỉ Apps Script và mật khẩu để lấy nội dung thông báo khi có tin đẩy */
self.addEventListener('message',e=>{
  const d=e.data;
  if(d&&d.type==='cfg')e.waitUntil(caches.open(CFG).then(c=>c.put('cfg-store',new Response(JSON.stringify(d.cfg)))));
});
async function showDue(){
  let items=null;
  try{
    const c=await caches.open(CFG),r=await c.match('cfg-store');
    if(r){
      const cfg=await r.json();
      const res=await fetch(cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:cfg.key,action:'due'})});
      const j=await res.json();
      if(j&&j.ok&&Array.isArray(j.items))items=j.items;
    }
  }catch(e){}
  let title='Sổ Chi Tiêu',body='Mở app để xem các khoản sắp đến hạn.';
  if(items&&items.length===1){title=items[0].title;body=items[0].body}
  else if(items&&items.length>1){title=items.length+' việc sắp đến hạn';body=items.slice(0,4).map(x=>x.title+': '+x.body).join('\n')}
  await self.registration.showNotification(title,{body,tag:'so-chi-tieu-due',renotify:true});
}
self.addEventListener('push',e=>{e.waitUntil(showDue())});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if('focus' in c)return c.focus()}
    return self.clients.openWindow(self.registration.scope);
  }));
});
