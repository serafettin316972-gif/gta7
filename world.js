// BOĞAZ CITY - Aşama 2: Açık dünya haritası (chunk tabanlı, optimize)
(function(){
var CH=240,BL=60,CMIN=-7,CMAX=6;
var ZN={sea:'DENİZ',beach:'PLAJ',wild:'DAĞLIK ORMAN',downtown:'ŞEHİR MERKEZİ',mid:'İŞ MERKEZİ',port:'LİMAN',suburb:'MAHALLE'};
function hash(x,z){var n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)}
function vn(x,z){var ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);
  var a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
function fbm(x,z){return vn(x/180,z/180)*.55+vn(x/70,z/70)*.3+vn(x/28,z/28)*.15}
function sm(a,b,x){var t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)}
function coastZ(x){return 950+120*Math.sin(x/420)+60*Math.sin(x/130+1)}
function mount(x,z){return Math.max(sm(-1000,-1450,z),sm(1150,1550,-x),sm(1150,1550,x))}
function H(x,z){var dc=z-coastZ(x);if(dc>0)return -.2-Math.min(dc*.07,14);var m=mount(x,z);if(m<.06)return 0;return (m-.06)/.94*(30+170*fbm(x+500,z-300))}
function zoneAt(x,z){
  var dc=z-coastZ(x);if(dc>0)return'sea';if(dc>-45)return'beach';
  if(mount(x,z)>.03)return'wild';
  var d=Math.hypot(x,z+150);if(d<420)return'downtown';
  if(x>420&&dc>-300)return'port';if(d<680)return'mid';return'suburb';
}
window.__mapFns={zoneAt:zoneAt,H:H};

window.startWorld=function(renderer,S,facade){
  var doc=document,msg=doc.getElementById('msg');
  doc.body.classList.add('ingame');
  msg.firstElementChild.textContent='HARİTA YÜKLENİYOR';msg.lastElementChild.textContent='Los Santos tarzı açık dünya hazırlanıyor...';msg.style.display='flex';
  var R=[2,3,4][S.quality]||3;
  var scene=new THREE.Scene();scene.fog=new THREE.Fog(0xf08a68,(R+.4)*CH*.3,(R+.4)*CH);
  var cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.5,2400);cam.rotation.order='YXZ';
  var sunDir=new THREE.Vector3(-1,.1,.35).normalize();
  var sky=new THREE.Mesh(new THREE.SphereGeometry(2000,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sun:{value:sunDir}},
    vertexShader:'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 v;uniform vec3 sun;void main(){float h=clamp(v.y,0.,1.);vec3 c=mix(vec3(.97,.54,.34),vec3(.9,.3,.5),smoothstep(0.,.2,h));c=mix(c,vec3(.12,.09,.32),smoothstep(.15,.7,h));float d=max(dot(v,sun),0.);c+=vec3(1.,.75,.4)*pow(d,6.)*.5+vec3(1.,.85,.5)*pow(d,40.)*.6+vec3(1.,.95,.75)*smoothstep(.9988,.9993,d)*3.;gl_FragColor=vec4(c,1.);}'}));
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xffb89a,0x403060,.9));
  var sl=new THREE.DirectionalLight(0xffc48a,1.3);sl.position.copy(sunDir).multiplyScalar(200);scene.add(sl);
  var water=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshPhongMaterial({color:0x2a74a8,specular:0xffc080,shininess:70}));
  water.rotation.x=-Math.PI/2;scene.add(water);

  // Dokular
  function roadTex(base){var c=doc.createElement('canvas');c.width=c.height=256;var g=c.getContext('2d');
    g.fillStyle='#2a2634';g.fillRect(0,0,256,256);g.fillStyle='#8a8499';g.fillRect(26,26,204,204);g.fillStyle=base;g.fillRect(34,34,188,188);
    g.fillStyle='#e8c14a';for(var k=0;k<256;k+=32){g.fillRect(k,0,16,3);g.fillRect(k,253,16,3);g.fillRect(0,k,3,16);g.fillRect(253,k,3,16)}
    var t=new THREE.CanvasTexture(c);t.anisotropy=8;return t}
  var roadU=new THREE.MeshLambertMaterial({map:roadTex('#5a5470')}),roadS=new THREE.MeshLambertMaterial({map:roadTex('#5f8b46')});
  var vcMat=new THREE.MeshLambertMaterial({vertexColors:true});

  // Birleştirme (merge) yardımcıları
  var BOX=new THREE.BoxGeometry(1,1,1),CONE=new THREE.ConeGeometry(.5,1,5),PYR=new THREE.ConeGeometry(.7071,1,4);PYR.rotateY(Math.PI/4);
  var col=new THREE.Color();
  function mk(f){return{P:[],N:[],U:[],C:[],I:[],o:0,F:f}}
  function add(S,g,x,y,z,sx,sy,sz,hex,plain){
    var p=g.attributes.position.array,n=g.attributes.normal.array,u=g.attributes.uv.array,ix=g.index.array,cnt=p.length/3;col.setHex(hex);
    for(var v=0;v<cnt;v++){
      S.P.push(p[v*3]*sx+x,(p[v*3+1]+.5)*sy+y,p[v*3+2]*sz+z);S.N.push(n[v*3],n[v*3+1],n[v*3+2]);S.C.push(col.r,col.g,col.b);
      if(S.F){var f=(v/4)|0,uu=.02,vv=.02;if(!plain&&f!==2&&f!==3){uu=u[v*2]*((f<2?sz:sx)/17.6);vv=u[v*2+1]*sy/28}S.U.push(uu,vv)}
    }
    for(var q=0;q<ix.length;q++)S.I.push(ix[q]+S.o);S.o+=cnt;
  }
  function quad(S,x,z){var o=S.o;
    S.P.push(x-30,.06,z-30,x-30,.06,z+30,x+30,.06,z+30,x+30,.06,z-30);
    for(var k=0;k<4;k++)S.N.push(0,1,0);S.U.push(0,0,0,1,1,1,1,0);S.I.push(o,o+1,o+3,o+1,o+2,o+3);S.o+=4}
  function fin(S,mat){if(!S.P.length)return null;var g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(S.P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(S.N,3));
    if(S.U.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(S.U,2));
    if(S.C.length)g.setAttribute('color',new THREE.Float32BufferAttribute(S.C,3));
    g.setIndex(S.I);return new THREE.Mesh(g,mat)}

  // Yapılar
  var TINTS=[0xffd9c8,0xc9c0ff,0xb8d4ff,0xffe8b0,0xe0b8d8,0xa8c8d8,0xf0c0a0,0xd8d8e8],GREENS=[0x3a7a3c,0x2f6a38,0x4a8a3c,0x2f5a3a],
      CONT=[0xc0392b,0x2980b9,0xe67e22,0x27ae60,0x7f8c8d,0xf1c40f],ROOF=[0xa0402f,0x7a4a3a,0x5a5a6a,0x8a3a3a];
  function tree(N,x,y,z,s){var g=GREENS[(hash(x,z)*4)|0];
    add(N,BOX,x,y,z,.7*s,2.2*s,.7*s,0x5a3c28);add(N,CONE,x,y+1.6*s,z,5*s,6*s,5*s,g);add(N,CONE,x,y+4.2*s,z,3.6*s,5*s,3.6*s,g)}
  function forest(N,bx,bz,rn,n){for(var k=0;k<n;k++){var x=bx+(rn()-.5)*56,z=bz+(rn()-.5)*56;
    if(z>coastZ(x)-50)continue;var h=H(x,z);if(h>135)continue;tree(N,x,h,z,.8+rn()*1.1)}}
  function tower(F,x,z,w,h){var t=TINTS[(hash(x,z)*8)|0],h1=h*.66,w2=w*.72,h2=h*.22,w3=w*.42,h3=h*.12;
    add(F,BOX,x,0,z,w,h1,w,t);add(F,BOX,x,h1,z,w2,h2,w2,t);add(F,BOX,x,h1+h2,z,w3,h3,w3,t);
    add(F,BOX,x,h,z,.6,h*.16,.6,0x2a2a35,true);add(F,BOX,x-w*.2,h1+h2,z,3,2,3,0x555060,true)}
  function midb(F,x,z,w,d,h){var t=TINTS[(hash(x,z)*8)|0];
    add(F,BOX,x,0,z,w,h,d,t);add(F,BOX,x,h,z,w*.92,.7,d*.92,0x6a5a6a,true);add(F,BOX,x+w*.15,h+.7,z,2.4,1.8,2.4,0x4a4658,true)}
  function house(F,N,x,z,rn){var w=8+rn()*3,d=7+rn()*3,h=4+rn()*2.5;
    add(F,BOX,x,0,z,w,h,d,TINTS[(rn()*8)|0]);add(N,PYR,x,h,z,w+.8,2.4,d+.8,ROOF[(rn()*4)|0]);
    if(rn()<.5)tree(N,x+w*.8,0,z+d*.9,.7+rn()*.4)}
  function harbor(N,bx,bz,rn){var dc=bz-coastZ(bx);
    if(rn()<.25){add(N,BOX,bx,0,bz,44,13,40,0x7b8798);add(N,BOX,bx,13,bz,46,.8,42,0x4a4f5c)}
    else{for(var r=0;r<8;r++)for(var c=0;c<3;c++){if(rn()<.25)continue;var k=1+((rn()*3)|0),x=bx-18+c*14,z=bz-21+r*6,col2=CONT[(rn()*6)|0];
      for(var s=0;s<k;s++)add(N,BOX,x,s*2.7,z,12,2.6,2.6,col2)}}
    if(dc>-160&&rn()<.5){for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2)add(N,BOX,bx+a*10,0,bz+b*6,1.2,30,1.2,0xd9442b);add(N,BOX,bx,30,bz,3,2.5,50,0xd9442b)}}
  function palms(N,bx,bz,rn){for(var k=0;k<3;k++){var x=bx+(rn()-.5)*56,z=coastZ(x)-5-rn()*35;
    add(N,BOX,x,0,z,.5,7,.5,0x7a5a3a);add(N,CONE,x,6.5,z,6,2,6,0x2f8a3a)}}
  function block(F,N,RU,RS,bx,bz){
    var zn=zoneAt(bx,bz);if(zn==='sea')return;var q=0,rn=function(){q++;return hash(bx*.731+q*13.7,bz*.373+q*7.9)};
    if(zn==='wild'){forest(N,bx,bz,rn,S.quality?26:16);return}
    if(zn==='beach'){palms(N,bx,bz,rn);return}
    quad(zn==='suburb'?RS:RU,bx,bz);var d=Math.hypot(bx,bz+150);
    if(zn==='downtown'){if(rn()<.18){forest(N,bx,bz,rn,10);return}tower(F,bx,bz,26+rn()*12,70+rn()*130*(1-d/560)+(d<150?40:0))}
    else if(zn==='mid'){for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2)if(rn()>.25)midb(F,bx+a*14,bz+b*14,20+rn()*4,20+rn()*4,12+rn()*34)}
    else if(zn==='port')harbor(N,bx,bz,rn);
    else{for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j++){if(rn()<.78)house(F,N,bx+i*18,bz+j*18,rn);else tree(N,bx+i*18,0,bz+j*18,1)}}
  }
  function groundMesh(x0,z0){
    var seg=24,st=CH/seg,P=[],Cc=[],Ix=[],c=new THREE.Color();
    for(var i=0;i<=seg;i++)for(var j=0;j<=seg;j++){
      var x=x0+i*st,z=z0+j*st,h=H(x,z),dc=z-coastZ(x),m=mount(x,z);P.push(x,h,z);
      if(dc>-45)c.setHex(h<-3?0x8a7a55:0xd9c48f);
      else if(m>.06){c.setHex(h<28?0x4f7a3c:h<85?0x3f6633:h<130?0x7d746b:0xeeeef5)}
      else c.setHex(zoneAt(x,z)==='suburb'?0x5f8b46:0x56506a);
      c.offsetHSL(0,0,hash(x*.17,z*.13)*.08-.04);Cc.push(c.r,c.g,c.b);
    }
    for(i=0;i<seg;i++)for(j=0;j<seg;j++){var a=i*(seg+1)+j,cc=a+seg+1;Ix.push(a,a+1,cc,a+1,cc+1,cc)}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(Ix);g.computeVertexNormals();return new THREE.Mesh(g,vcMat)}
  function build(cx,cz){
    var x0=cx*CH,z0=cz*CH,F=mk(true),N=mk(false),RU=mk(true),RS=mk(true),g=new THREE.Group();
    g.add(groundMesh(x0,z0));
    for(var i=0;i<4;i++)for(var j=0;j<4;j++)block(F,N,RU,RS,x0+30+i*BL,z0+30+j*BL);
    [[F,facade],[N,vcMat],[RU,roadU],[RS,roadS]].forEach(function(p){var m=fin(p[0],p[1]);if(m)g.add(m)});
    scene.add(g);return g}

  // Chunk yönetimi
  var chunks={},queue=[],loaded=0,ready=false;
  function update(){
    var ccx=Math.floor(cam.position.x/CH),ccz=Math.floor(cam.position.z/CH);
    for(var dx=-R;dx<=R;dx++)for(var dz=-R;dz<=R;dz++){var cx=ccx+dx,cz=ccz+dz,k=cx+','+cz;
      if(cx<CMIN||cx>CMAX||cz<CMIN||cz>CMAX||chunks[k]||queue.some(function(q){return q.k===k}))continue;queue.push({k:k,cx:cx,cz:cz})}
    queue.forEach(function(q){q.d=Math.abs(q.cx-ccx)+Math.abs(q.cz-ccz)});queue.sort(function(a,b){return a.d-b.d});
    for(var k2 in chunks){var c=chunks[k2];if(Math.max(Math.abs(c.cx-ccx),Math.abs(c.cz-ccz))>R+1){
      scene.remove(c.g);c.g.traverse(function(o){if(o.geometry)o.geometry.dispose()});delete chunks[k2];loaded--}}
  }
  function buildNext(){var q=queue.shift();if(!q||chunks[q.k])return;chunks[q.k]={cx:q.cx,cz:q.cz,g:build(q.cx,q.cz)};loaded++}

  // HUD + minimap
  var st=doc.createElement('style');st.textContent='.ingame .ui,.ingame .bar,.ingame #hint,.ingame #shint{display:none}'+
   '#hud{position:fixed;top:14px;left:16px;z-index:8;font:700 15px Rajdhani,sans-serif;letter-spacing:.15em;text-shadow:0 2px 4px #000;color:#fff}#hud small{display:block;opacity:.7;font-size:12px}'+
   '#mm{position:fixed;left:16px;bottom:16px;z-index:8;width:190px;height:190px;border:2px solid #fff8;border-radius:6px;overflow:hidden;transition:all .3s}#mm.big{width:min(80vh,80vw);height:min(80vh,80vw);left:50%;bottom:50%;transform:translate(-50%,50%)}'+
   '#mm canvas{width:100%;height:100%;display:block;image-rendering:pixelated}#mk{position:absolute;width:0;height:0;border:6px solid transparent;border-bottom:14px solid #ff4e7e;margin:-10px 0 0 -6px}'+
   '#ctl{position:fixed;bottom:14px;right:16px;z-index:8;font:600 13px Rajdhani,sans-serif;letter-spacing:.12em;opacity:.8;text-align:right;text-shadow:0 2px 4px #000;color:#fff}';
  doc.head.appendChild(st);
  var hud=doc.createElement('div');hud.id='hud';doc.body.appendChild(hud);
  var ctl=doc.createElement('div');ctl.id='ctl';ctl.innerHTML='TIKLA: FAREYİ YAKALA &nbsp;·&nbsp; WASD: HAREKET &nbsp;·&nbsp; SHIFT: HIZLI<br>SPACE/C: YUKARI-AŞAĞI &nbsp;·&nbsp; M: HARİTA';doc.body.appendChild(ctl);
  var mm=doc.createElement('div');mm.id='mm';var mc=doc.createElement('canvas');mc.width=mc.height=200;mm.appendChild(mc);var mk2=doc.createElement('div');mk2.id='mk';mm.appendChild(mk2);doc.body.appendChild(mm);
  (function(){var g=mc.getContext('2d'),im=g.createImageData(200,200),cl={sea:[42,111,158],beach:[217,196,143],downtown:[122,106,154],mid:[106,98,128],port:[154,138,112],suburb:[111,154,90]};
    for(var py=0;py<200;py++)for(var px=0;px<200;px++){var x=-1600+px*16+8,z=-1600+py*16+8,zn=zoneAt(x,z),c=cl[zn],o=(py*200+px)*4;
      if(!c){var h=H(x,z),s=Math.min(1,h/150);c=[60+s*150,110+s*90-s*20,60+s*150]}
      im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255}g.putImageData(im,0,0)})();

  // Kontroller (serbest uçuş kamerası)
  var keys={},yaw=Math.PI,pitch=-.22;cam.position.set(80,60,-520);
  var cv=renderer.domElement;
  cv.addEventListener('click',function(){if(cv.requestPointerLock)cv.requestPointerLock()});
  doc.addEventListener('mousemove',function(e){if(doc.pointerLockElement!==cv)return;yaw-=e.movementX*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*.0022))});
  addEventListener('keydown',function(e){keys[e.code]=true;if(e.code==='KeyM')mm.classList.toggle('big')});
  addEventListener('keyup',function(e){keys[e.code]=false});
  addEventListener('resize',function(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

  var last=performance.now(),fr=0,ft=last,fps=0,tick=0;
  function frame(now){
    requestAnimationFrame(frame);var dt=Math.min((now-last)/1000,.1);last=now;
    var sp=keys.ShiftLeft?320:70,f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0),u=(keys.Space?1:0)-(keys.KeyC?1:0),cp=Math.cos(pitch),p=cam.position;
    p.x+=(-Math.sin(yaw)*cp*f+Math.cos(yaw)*r)*sp*dt;p.y+=(Math.sin(pitch)*f+u)*sp*dt;p.z+=(-Math.cos(yaw)*cp*f-Math.sin(yaw)*r)*sp*dt;
    p.x=Math.max(-1590,Math.min(1590,p.x));p.z=Math.max(-1590,Math.min(1590,p.z));p.y=Math.max(H(p.x,p.z)+2,Math.min(600,p.y));
    cam.rotation.set(pitch,yaw,0);sky.position.copy(p);water.position.set(p.x,-.3,p.z);
    if((tick++&7)===0||!ready)update();
    var per=ready?1:4;while(per--&&queue.length)buildNext();
    if(!ready&&loaded>=16){ready=true;msg.style.display='none';var fd=doc.getElementById('fade');fd.classList.remove('dark');fd.classList.add('out')}
    renderer.render(scene,cam);
    fr++;if(now-ft>500){fps=Math.round(fr*1000/(now-ft));fr=0;ft=now;
      hud.innerHTML=ZN[zoneAt(p.x,p.z)]+'<small>X '+(p.x|0)+'  Z '+(p.z|0)+'  Y '+(p.y|0)+'  ·  '+fps+' FPS</small>'}
    mk2.style.left=((p.x+1600)/32)+'%';mk2.style.top=((p.z+1600)/32)+'%';mk2.style.transform='rotate('+(-yaw)+'rad)';
  }
  requestAnimationFrame(frame);
};
})();
