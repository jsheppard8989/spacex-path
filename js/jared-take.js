// Jared's take: loads data/spacex_commentary.md (the one file to edit) into #jaredTake.
// Fallback chain on failure: same file from the repo's main branch -> the last copy this
// browser loaded. The box never shows a placeholder; with nothing at all it stays hidden.
(function(){
  var box=document.getElementById('jaredTake'); if(!box) return;
  var KEY='jaredTake:lastgood';
  var SOURCES=['data/spacex_commentary.md?v='+Date.now(),
    'https://raw.githubusercontent.com/jsheppard8989/spacex-path/main/data/spacex_commentary.md?v='+Date.now()];
  function esc(s){return s.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(t){return (t||'').replace(/<!--[\s\S]*?-->/g,'').replace(/\r\n/g,'\n').trim();}
  function render(t){
    var paras=t.split(/\n\s*\n/), title='', html='';
    paras.forEach(function(p){
      p=p.trim().replace(/\n/g,' '); if(!p) return;
      if(/^# /.test(p)&&!title){title=p.slice(2).trim();return;}
      if(/^Disclaimer:/.test(p)) html+='<p class="joke-disclaimer"><i>'+esc(p)+'</i></p>';
      else html+='<p>'+esc(p)+'</p>';
    });
    if(!html) return false;
    document.getElementById('jaredTakeTitle').textContent=title;
    document.getElementById('jaredTakeBody').innerHTML=html;
    box.hidden=false; return true;
  }
  function stored(){try{return localStorage.getItem(KEY)||'';}catch(e){return '';}}
  var s=stored(); if(s) render(s);  // show last good right away, then upgrade
  function tryAt(i){
    if(i>=SOURCES.length) return;  // nothing new: keep whatever is shown
    fetch(SOURCES[i],{cache:'no-store'}).then(function(r){if(!r.ok) throw 0; return r.text();}).then(function(t){
      t=clean(t); if(!t||!render(t)) throw 0;
      try{localStorage.setItem(KEY,t);}catch(e){}
    }).catch(function(){tryAt(i+1);});
  }
  tryAt(0);
})();
