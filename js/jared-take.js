// Jared's take: loads data/spacex_commentary.md (the one file to edit) into #jaredTake.
(function(){
  var box=document.getElementById('jaredTake'); if(!box) return;
  function esc(s){return s.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  fetch('data/spacex_commentary.md?v='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(t){
    t=t.replace(/<!--[\s\S]*?-->/g,'').replace(/\r\n/g,'\n').trim(); if(!t) return;
    var paras=t.split(/\n\s*\n/), title='', html='';
    paras.forEach(function(p){
      p=p.trim().replace(/\n/g,' '); if(!p) return;
      if(/^# /.test(p)&&!title){title=p.slice(2).trim();return;}
      if(/^Disclaimer:/.test(p)) html+='<p class="joke-disclaimer"><i>'+esc(p)+'</i></p>';
      else html+='<p>'+esc(p)+'</p>';
    });
    document.getElementById('jaredTakeTitle').textContent=title;
    document.getElementById('jaredTakeBody').innerHTML=html;
    box.hidden=false;
  }).catch(function(){});
})();
