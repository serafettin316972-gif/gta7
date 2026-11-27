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
  var sl=new THREE.DirectionalLight(0xffc48a,1.3);var SH=S.quality>0;sl.position.set(-120,75,45);sl.castShadow=SH;scene.add(sl);scene.add(sl.target);
  if(SH){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;facade.needsUpdate=true;var shc=sl.shadow.camera;shc.left=shc.bottom=-100;shc.right=shc.top=100;shc.near=1;shc.far=400;
    sl.shadow.mapSize.set(S.quality>1?2048:1024,S.quality>1?2048:1024);sl.shadow.bias=-.0007;sl.shadow.normalBias=.4}
  var water=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshPhongMaterial({color:0x2a74a8,specular:0xffc080,shininess:70}));
  water.rotation.x=-Math.PI/2;scene.add(water);

  // Dokular
  function roadTex(base,extra){var c=doc.createElement('canvas');c.width=c.height=256;var g=c.getContext('2d');
    g.fillStyle='#2a2634';g.fillRect(0,0,256,256);g.fillStyle='#8a8499';g.fillRect(26,26,204,204);g.fillStyle=base;g.fillRect(34,34,188,188);
    g.fillStyle='#e8c14a';for(var k=0;k<256;k+=32){g.fillRect(k,0,16,3);g.fillRect(k,253,16,3);g.fillRect(0,k,3,16);g.fillRect(253,k,3,16)}
    g.fillStyle='rgba(255,255,255,.8)';
    for(var q=0;q<5;q++){g.fillRect(36,3+q*5,16,3);g.fillRect(204,3+q*5,16,3);g.fillRect(36,230+q*5,16,3);g.fillRect(204,230+q*5,16,3);
      g.fillRect(3+q*5,36,3,16);g.fillRect(3+q*5,204,3,16);g.fillRect(230+q*5,36,3,16);g.fillRect(230+q*5,204,3,16)}
    if(extra)extra(g);
    var t=new THREE.CanvasTexture(c);t.anisotropy=8;return t}
  var roadU=new THREE.MeshLambertMaterial({map:roadTex('#5a5470')}),roadS=new THREE.MeshLambertMaterial({map:roadTex('#5f8b46')});
  var lotMat=new THREE.MeshLambertMaterial({map:roadTex('#3b3944',function(g){var K=256/60,X=function(x){return (x+30)*K},Z=function(z){return (30-z)*K};
    g.fillStyle='#4d7a3c';g.fillRect(X(-21),Z(3),X(21)-X(-21),Z(-3)-Z(3));
    g.fillStyle='rgba(255,255,255,.85)';
    [[-22,-16.5],[-10,-4.5],[4.5,10],[16.5,22]].forEach(function(r){for(var k=0;k<=14;k++)g.fillRect(X(-19.6+k*2.8)-1,Z(r[1]),2,Z(r[0])-Z(r[1]))})})});
  var vcMat=new THREE.MeshLambertMaterial({vertexColors:true});
  var carMat=new THREE.MeshPhongMaterial({vertexColors:true,shininess:80,specular:0x8a7a66});

  // Birleştirme (merge) yardımcıları
  var BOX=new THREE.BoxGeometry(1,1,1),CONE=new THREE.ConeGeometry(.5,1,5),PYR=new THREE.ConeGeometry(.7071,1,4);PYR.rotateY(Math.PI/4);
  var col=new THREE.Color();
  function mk(f){return{P:[],N:[],U:[],C:[],I:[],o:0,F:f}}
  function add(S,g,x,y,z,sx,sy,sz,hex,plain,rx){
    var p=g.attributes.position.array,n=g.attributes.normal.array,u=g.attributes.uv.array,ix=g.index.array,cnt=p.length/3;col.setHex(hex);
    for(var v=0;v<cnt;v++){
      var lx=p[v*3]*sx,ly=(p[v*3+1]+.5)*sy,lz=p[v*3+2]*sz,nx=n[v*3],ny=n[v*3+1],nz=n[v*3+2];
      if(rx){var cr=Math.cos(rx),sr=Math.sin(rx),tt=ly*cr-lz*sr;lz=ly*sr+lz*cr;ly=tt;tt=ny*cr-nz*sr;nz=ny*sr+nz*cr;ny=tt}
      S.P.push(lx+x,ly+y,lz+z);S.N.push(nx,ny,nz);S.C.push(col.r,col.g,col.b);
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

  var curCols=[],carsAll=[],genSet={},curGen=false;
  var CT={sedan:{L:4.6,W:1.85,bh:.5,ch:.56,cl:.5,cz:-.2,rf:.3,rr:.28,wb:1.45,vmax:44,pm:110,mu:1.05,y0:.2},
    suv:{L:4.8,W:1.98,bh:.7,ch:.74,cl:.56,cz:-.3,rf:.4,rr:.42,wb:1.5,vmax:40,pm:90,mu:.98,y0:.3},
    sport:{L:4.3,W:1.92,bh:.42,ch:.42,cl:.42,cz:-.1,rf:.22,rr:.22,wb:1.35,vmax:58,pm:210,mu:1.3,y0:.14,sp:1},
    hatch:{L:3.8,W:1.72,bh:.52,ch:.6,cl:.62,cz:-.4,rf:.36,rr:.46,wb:1.2,vmax:40,pm:85,mu:1.0,y0:.2}};
  var CC=[0xc0392b,0x2c3e50,0xecf0f1,0x7f8c8d,0x1e8449,0xf1c40f,0x8e44ad,0x2980b9,0x151515,0x6e2c1f];
  var WHEEL=new THREE.CylinderGeometry(.5,.5,1,12);WHEEL.rotateZ(Math.PI/2);
  function carParts(S,T,c,gl,wh){
    var y0=T.y0,W=T.W,L=T.L,bh=T.bh,ch=T.ch,cl=L*T.cl,cz=T.cz,dk=0x1a1b20,zf=cz+cl/2,zr=cz-cl/2,yb=y0+bh+.04,s,sx,sz;
    add(S,BOX,0,y0,0,W*.97,.14,L*.97,dk);add(S,BOX,0,y0+.1,0,W,bh-.06,L,c);
    add(S,BOX,0,yb,cz,W*.905,ch*.55,cl,gl);
    var rzf=cz+cl*T.rf,rzr=cz-cl*T.rr;add(S,BOX,0,yb+ch*.55,(rzf+rzr)/2,W*.86,ch*.45,rzf-rzr,c);
    var zb=zf+.1,dz=zb-rzf;add(S,BOX,0,yb+ch/2,(zb+rzf)/2,W*.84,.04,Math.hypot(dz,ch),gl,false,Math.atan2(ch,dz));
    var zbr=zr-.1,dzr=rzr-zbr;add(S,BOX,0,yb+ch/2,(zbr+rzr)/2,W*.84,.04,Math.hypot(dzr,ch),gl,false,-Math.atan2(ch,dzr));
    add(S,BOX,0,y0+.12,L/2-.02,W*.62,bh*.5,.05,0x0c0c10);
    add(S,BOX,0,y0,L/2-.04,W*1.01,.22,.14,dk);add(S,BOX,0,y0,-L/2+.04,W*1.01,.22,.14,dk);
    add(S,BOX,0,y0+.14,L/2+.02,.5,.12,.02,0xf2f2f2);add(S,BOX,0,y0+.14,-L/2-.02,.5,.12,.02,0xf2f2f2);
    for(s=-1;s<=1;s+=2){
      add(S,BOX,s*W*.33,y0+bh*.6,L/2,.4,.14,.06,0xfff4cc);add(S,BOX,s*W*.33,y0+bh*.6,-L/2,.42,.14,.06,0x8a1212);
      add(S,BOX,s*(W/2+.06),yb+.08,zf-.05,.12,.1,.2,c);
      add(S,BOX,s*(W/2+.003),y0+.12,cz+cl*.25,.012,bh*.6,.02,0x0e0e12);add(S,BOX,s*(W/2+.003),y0+.12,cz-cl*.25,.012,bh*.6,.02,0x0e0e12)}
    if(T.sp){add(S,BOX,0,yb+.2,-L/2+.25,W*.9,.05,.28,0x101014);for(s=-1;s<=1;s+=2)add(S,BOX,s*W*.36,yb,-L/2+.25,.05,.2,.2,0x101014)}
    for(sx=-1;sx<=1;sx+=2)for(sz=-1;sz<=1;sz+=2){var wx=sx*(W/2-.1),wz=sz*T.wb;
      add(S,BOX,sx*(W/2-.02),y0+.02,wz,.05,.48,.9,0x0a0a0d);
      if(wh){add(S,WHEEL,wx,0,wz,.26,.72,.72,0x131313);add(S,WHEEL,wx+sx*.02,.14,wz,.27,.44,.44,0xaab0b8)}}
  }
  function addCar(x,z,h,rn){if(!curGen)return;var r=rn(),t=r<.4?'sedan':r<.65?'hatch':r<.85?'suv':'sport';
    carsAll.push({id:carsAll.length,type:t,ci:(rn()*CC.length)|0,x:x,z:z,y:H(x,z),h:h,state:rn()<.8?'locked':'open',alarm:0,flash:0,broken:false,
      vx:0,vz:0,sp:0,steer:0,eng:false,hot:0,hotT:1,tp:0,tr:0,mesh:null,drv:false,rig:null,hz:null})}
  // Yapılar
  var TINTS=[0xffd9c8,0xc9c0ff,0xb8d4ff,0xffe8b0,0xe0b8d8,0xa8c8d8,0xf0c0a0,0xd8d8e8],GREENS=[0x3a7a3c,0x2f6a38,0x4a8a3c,0x2f5a3a],
      CONT=[0xc0392b,0x2980b9,0xe67e22,0x27ae60,0x7f8c8d,0xf1c40f],ROOF=[0xa0402f,0x7a4a3a,0x5a5a6a,0x8a3a3a];
  function tree(N,x,y,z,s){var g=GREENS[(hash(x,z)*4)|0];
    add(N,BOX,x,y,z,.7*s,2.2*s,.7*s,0x5a3c28);add(N,CONE,x,y+1.6*s,z,5*s,6*s,5*s,g);add(N,CONE,x,y+4.2*s,z,3.6*s,5*s,3.6*s,g)}
  function forest(N,bx,bz,rn,n){for(var k=0;k<n;k++){var x=bx+(rn()-.5)*56,z=bz+(rn()-.5)*56;
    if(z>coastZ(x)-50)continue;var h=H(x,z);if(h>135)continue;tree(N,x,h,z,.8+rn()*1.1)}}
  function tower(F,x,z,w,h){curCols.push([x,z,w/2,w/2,h*.66]);var t=TINTS[(hash(x,z)*8)|0],h1=h*.66,w2=w*.72,h2=h*.22,w3=w*.42,h3=h*.12;
    add(F,BOX,x,0,z,w,h1,w,t);add(F,BOX,x,h1,z,w2,h2,w2,t);add(F,BOX,x,h1+h2,z,w3,h3,w3,t);
    add(F,BOX,x,h,z,.6,h*.16,.6,0x2a2a35,true);add(F,BOX,x-w*.2,h1+h2,z,3,2,3,0x555060,true)}
  function midb(F,x,z,w,d,h){curCols.push([x,z,w/2,d/2,h]);var t=TINTS[(hash(x,z)*8)|0];
    add(F,BOX,x,0,z,w,h,d,t);add(F,BOX,x,h,z,w*.92,.7,d*.92,0x6a5a6a,true);add(F,BOX,x+w*.15,h+.7,z,2.4,1.8,2.4,0x4a4658,true)}
  function house(F,N,x,z,rn){var w=8+rn()*3,d=7+rn()*3,h=4+rn()*2.5;curCols.push([x,z,w/2,d/2,h]);
    add(F,BOX,x,0,z,w,h,d,TINTS[(rn()*8)|0]);add(N,PYR,x,h,z,w+.8,2.4,d+.8,ROOF[(rn()*4)|0]);
    if(rn()<.5)tree(N,x+w*.8,0,z+d*.9,.7+rn()*.4)}
  function harbor(N,bx,bz,rn){var dc=bz-coastZ(bx);
    if(dc>-60){var zc=coastZ(bx);add(N,BOX,bx+10,.1,zc+25,6,.5,60,0x8a6a4a);add(N,BOX,bx+16,-.5,zc+30,3,1,8,0xf2f2f2);add(N,BOX,bx+16,.5,zc+31,2.4,1.1,3,0xcfd8dc)}
    if(rn()<.25){curCols.push([bx,bz,22,20,13]);add(N,BOX,bx,0,bz,44,13,40,0x7b8798);add(N,BOX,bx,13,bz,46,.8,42,0x4a4f5c)}
    else{for(var r=0;r<8;r++)for(var c=0;c<3;c++){if(rn()<.25)continue;var k=1+((rn()*3)|0),x=bx-18+c*14,z=bz-21+r*6,col2=CONT[(rn()*6)|0];
      for(var s=0;s<k;s++)add(N,BOX,x,s*2.7,z,12,2.6,2.6,col2)}}
    if(dc>-160&&rn()<.5){for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2)add(N,BOX,bx+a*10,0,bz+b*6,1.2,30,1.2,0xd9442b);add(N,BOX,bx,30,bz,3,2.5,50,0xd9442b)}}
  function palms(N,bx,bz,rn){for(var k=0;k<3;k++){var x=bx+(rn()-.5)*56,z=coastZ(x)-5-rn()*35;
    add(N,BOX,x,0,z,.5,7,.5,0x7a5a3a);add(N,CONE,x,6.5,z,6,2,6,0x2f8a3a)}}
  function lounger(N,x,z,c){add(N,BOX,x,.3,z,.7,.1,1.3,c);add(N,BOX,x,.71,z-.4,.7,.08,.8,c,false,.9);add(N,BOX,x-.3,0,z+.5,.06,.3,.06,0x999999);add(N,BOX,x+.3,0,z+.5,.06,.3,.06,0x999999)}
  function umbrella(N,x,z,c){add(N,BOX,x,0,z,.08,2.4,.08,0xdddddd);add(N,CONE,x,2.2,z,3.2,.7,3.2,c)}
  function lamps(N,bx,bz){for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2){var x=bx+a*24.2,z=bz+b*24.2;add(N,BOX,x,0,z,.2,6.5,.2,0x44444e);add(N,BOX,x-a*.45,6.4,z,1,.18,.4,0xfff0b0)}}
  function lotCars(N,bx,bz,rn){for(var k=0;k<5;k++)tree(N,bx-16+k*8,0,bz,.9);
    [[-19.25,0],[-7.25,Math.PI],[7.25,0],[19.25,Math.PI]].forEach(function(r){for(var k=0;k<14;k++)if(rn()>.5)addCar(bx-18.2+k*2.8+(rn()-.5)*.3,bz+r[0]+(rn()-.5)*.4,r[1]+(rn()-.5)*.05,rn)})}
  function beachBlock(N,RL,bx,bz,rn){
    if(coastZ(bx)-bz>40&&rn()<.3){quad(RL,bx,bz);lotCars(N,bx,bz,rn);return}
    palms(N,bx,bz,rn);var UC=[0xe74c3c,0xf1c40f,0x3498db,0xffffff];
    for(var k=0;k<5;k++){var x=bx-24+k*12+rn()*3,z=coastZ(x)-15-rn()*8;lounger(N,x,z,0xf4f4f4);lounger(N,x+1.4,z+.2,0x5dade2);umbrella(N,x+.7,z+.2,UC[(rn()*4)|0])}
    if(rn()<.25){var tx=bx+(rn()-.5)*30,tz=coastZ(tx)-34;for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2)add(N,BOX,tx+a,0,tz+b,.2,2.6,.2,0xffffff);add(N,BOX,tx,2.6,tz,2.6,1.6,2.6,0xffffff);add(N,PYR,tx,4.2,tz,3.4,1,3.4,0xd9442b)}
  }
  function block(F,N,RU,RS,RL,bx,bz){
    var zn=zoneAt(bx,bz);if(zn==='sea')return;var q=0,rn=function(){q++;return hash(bx*.731+q*13.7,bz*.373+q*7.9)};
    if(zn==='wild'){forest(N,bx,bz,rn,S.quality?26:16);return}
    if(zn==='beach'){beachBlock(N,RL,bx,bz,rn);return}
    var isLot=(zn==='downtown'||zn==='mid'||zn==='port')&&rn()<.13;if(isLot){quad(RL,bx,bz);lotCars(N,bx,bz,rn);lamps(N,bx,bz);return}
    quad(zn==='suburb'?RS:RU,bx,bz);lamps(N,bx,bz);var d=Math.hypot(bx,bz+150);
    if(zn==='downtown'){if(rn()<.18){forest(N,bx,bz,rn,10);return}tower(F,bx,bz,26+rn()*12,70+rn()*130*(1-d/560)+(d<150?40:0))}
    else if(zn==='mid'){for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2)if(rn()>.25)midb(F,bx+a*13,bz+b*13,17+rn()*3,17+rn()*3,12+rn()*34)}
    else if(zn==='port')harbor(N,bx,bz,rn);
    else{for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j++){if(rn()<.78){house(F,N,bx+i*17,bz+j*17,rn);if(i<1&&rn()<.55)addCar(bx+i*17+8.7,bz+j*17+(rn()-.5)*1.5,(rn()<.5?0:Math.PI)+(rn()-.5)*.08,rn)}else tree(N,bx+i*17,0,bz+j*17,1)}}
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
    var x0=cx*CH,z0=cz*CH,F=mk(true),N=mk(false),RU=mk(true),RS=mk(true),RL=mk(true),g=new THREE.Group(),gk=cx+','+cz;curGen=!genSet[gk];genSet[gk]=true;
    curCols=[];var gm=groundMesh(x0,z0);gm.receiveShadow=SH;g.add(gm);
    for(var i=0;i<4;i++)for(var j=0;j<4;j++)block(F,N,RU,RS,RL,x0+30+i*BL,z0+30+j*BL);
    [[F,facade,1],[N,vcMat,1],[RU,roadU,0],[RS,roadS,0],[RL,lotMat,0]].forEach(function(p){var m=fin(p[0],p[1]);if(m){m.receiveShadow=SH;m.castShadow=SH&&!!p[2];g.add(m)}});
    g.userData.cols=curCols;scene.add(g);return g}

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
   '#mm canvas{position:static!important;inset:auto!important;width:100%!important;height:100%!important;display:block;image-rendering:pixelated}#mk{position:absolute;width:0;height:0;border:6px solid transparent;border-bottom:14px solid #ff4e7e;margin:-10px 0 0 -6px}'+
   '#ctl{position:fixed;bottom:14px;right:16px;z-index:8;font:600 13px Rajdhani,sans-serif;letter-spacing:.12em;opacity:.8;text-align:right;text-shadow:0 2px 4px #000;color:#fff}';
  doc.head.appendChild(st);
  var hud=doc.createElement('div');hud.id='hud';doc.body.appendChild(hud);
  var ctl=doc.createElement('div');ctl.id='ctl';ctl.innerHTML='TIKLA: FAREYİ YAKALA &nbsp;·&nbsp; WASD: YÜRÜ &nbsp;·&nbsp; SHIFT: KOŞ &nbsp;·&nbsp; SPACE: ZIPLA<br>V: 1./3. ŞAHIS &nbsp;·&nbsp; ALT: YAVAŞ &nbsp;·&nbsp; F: UÇUŞ &nbsp;·&nbsp; M: HARİTA';doc.body.appendChild(ctl);
  var mm=doc.createElement('div');mm.id='mm';var mc=doc.createElement('canvas');mc.width=mc.height=200;mm.appendChild(mc);var mk2=doc.createElement('div');mk2.id='mk';mm.appendChild(mk2);doc.body.appendChild(mm);
  (function(){var g=mc.getContext('2d'),im=g.createImageData(200,200),cl={sea:[42,111,158],beach:[217,196,143],downtown:[122,106,154],mid:[106,98,128],port:[154,138,112],suburb:[111,154,90]};
    for(var py=0;py<200;py++)for(var px=0;px<200;px++){var x=-1600+px*16+8,z=-1600+py*16+8,zn=zoneAt(x,z),c=cl[zn],o=(py*200+px)*4;
      if(!c){var h=H(x,z),s=Math.min(1,h/150);c=[50+s*130,100+s*80,50+s*120]}
      im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255}g.putImageData(im,0,0)})();

  // ---------- HUD ----------
  var st3=doc.createElement('style');st3.textContent='#prompt{position:fixed;left:50%;top:62%;transform:translateX(-50%);z-index:8;font:700 18px Rajdhani,sans-serif;letter-spacing:.14em;color:#fff;text-shadow:0 2px 6px #000;white-space:nowrap}'+
   '#note{position:fixed;left:50%;top:13vh;transform:translateX(-50%);z-index:9;font:700 20px Rajdhani,sans-serif;letter-spacing:.2em;color:#ffd9b0;text-shadow:0 2px 6px #000;opacity:0;transition:opacity .3s;white-space:nowrap}'+
   '#prog{position:fixed;left:50%;top:68%;transform:translateX(-50%);width:260px;z-index:8;text-align:center;font:700 14px Rajdhani,sans-serif;letter-spacing:.2em;color:#fff;display:none}#prog i{display:block;height:6px;background:#0008;border:1px solid #fff6;margin-top:4px}#prog b{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff4e7e,#ffb347)}'+
   '#spd{position:fixed;right:26px;bottom:70px;z-index:8;text-align:right;font-family:Rajdhani,sans-serif;color:#fff;text-shadow:0 2px 6px #000;display:none}#spd em{font:400 64px Anton,Impact,sans-serif;font-style:normal;letter-spacing:.04em}#spd u{text-decoration:none;opacity:.7;margin-left:6px;letter-spacing:.2em}#spd s{text-decoration:none;display:block;font:700 22px Rajdhani,sans-serif;letter-spacing:.2em;color:#ffb347}#spd i{display:block;height:6px;width:200px;margin-left:auto;background:#0008;border:1px solid #fff6}#spd b{display:block;height:100%;width:0;background:linear-gradient(90deg,#4ade80,#facc15,#ef4444)}'+
   '#inv{position:fixed;top:14px;right:16px;z-index:8;font:700 14px Rajdhani,sans-serif;letter-spacing:.15em;color:#ffd9b0;text-shadow:0 2px 4px #000}'+
   '#sta{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);width:220px;height:6px;background:#0008;border:1px solid #fff6;z-index:8;border-radius:3px;overflow:hidden}#sta i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff4e7e,#ffb347)}#sta.low i{background:#ff3030}';
  doc.head.appendChild(st3);
  var ui=doc.createElement('div');ui.innerHTML='<div id="prompt"></div><div id="note"></div><div id="prog"><span></span><i><b></b></i></div><div id="spd"><em>0</em><u>KM/H</u><s>N</s><i><b></b></i></div><div id="inv"></div><div id="sta"><i></i></div>';doc.body.appendChild(ui);
  var pEl=doc.getElementById('prompt'),nEl=doc.getElementById('note'),prEl=doc.getElementById('prog'),spdBox=doc.getElementById('spd'),invEl=doc.getElementById('inv'),sta=doc.getElementById('sta');
  var noteT=0,cloners=2;
  function note(t,ms){nEl.textContent=t;nEl.style.opacity=1;clearTimeout(noteT);noteT=setTimeout(function(){nEl.style.opacity=0},ms||2500)}
  function progShow(l,v){prEl.style.display='block';prEl.firstChild.textContent=l;prEl.querySelector('b').style.width=Math.min(100,v*100)+'%'}
  function progHide(){prEl.style.display='none'}
  function updInv(){invEl.textContent='ANAHTAR KLONLAYICI ×'+cloners}updInv();
  ctl.innerHTML='WASD: YÜRÜ/SÜR &nbsp;·&nbsp; SHIFT: KOŞ &nbsp;·&nbsp; SPACE: ZIPLA / EL FRENİ &nbsp;·&nbsp; E: BİN/İN<br>G: ANAHTAR KLONLA &nbsp;·&nbsp; V: 1./3. ŞAHIS &nbsp;·&nbsp; F: UÇUŞ &nbsp;·&nbsp; M: HARİTA';

  // ---------- Araba modelleri ----------
  var glowC=doc.createElement('canvas');glowC.width=64;glowC.height=128;var gg=glowC.getContext('2d'),gr=gg.createLinearGradient(0,0,0,128);
  gr.addColorStop(0,'rgba(255,240,200,.6)');gr.addColorStop(1,'rgba(255,240,200,0)');gg.fillStyle=gr;gg.fillRect(0,0,64,128);
  var glowM=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  var geoC={};
  function carGeo(c,mode){var key=c.type+c.ci+mode;if(geoC[key])return geoC[key];var St=mk(false);carParts(St,CT[c.type],CC[c.ci],mode==='b'?0x07090c:0x1b2a3a,mode!=='f');return(geoC[key]=fin(St,vcMat).geometry)}
  function mkParked(c){var m=new THREE.Mesh(carGeo(c,c.broken?'b':'p'),carMat);m.position.set(c.x,c.y,c.z);m.rotation.y=c.h;m.castShadow=m.receiveShadow=SH;scene.add(m);c.mesh=m}
  function makeFull(c){
    var T=CT[c.type],root=new THREE.Group(),tilt=new THREE.Group();root.add(tilt);tilt.add(new THREE.Mesh(carGeo(c,'f'),carMat));
    var bm=new THREE.MeshBasicMaterial({color:0x5a0f0f}),hm=new THREE.MeshBasicMaterial({color:0xfff6d0}),ly=T.y0+T.bh*.6+.07;
    for(var s=-1;s<=1;s+=2){var tl=new THREE.Mesh(new THREE.BoxGeometry(.4,.17,.07),bm);tl.position.set(s*T.W*.33,ly,-T.L/2-.02);tilt.add(tl);
      var hl=new THREE.Mesh(new THREE.BoxGeometry(.38,.16,.07),hm);hl.position.set(s*T.W*.33,ly,T.L/2+.02);tilt.add(hl)}
    var tireM=new THREE.MeshLambertMaterial({color:0x131313}),rimM=new THREE.MeshLambertMaterial({color:0x9aa0a8}),fw=[],sp=[];
    for(var sx=-1;sx<=1;sx+=2)for(var sz=-1;sz<=1;sz+=2){
      var pv=new THREE.Group();pv.position.set(sx*(T.W/2-.1),.36,sz*T.wb);var spin=new THREE.Group();
      var tire=new THREE.Mesh(WHEEL,tireM);tire.scale.set(.26,.72,.72);var rim=new THREE.Mesh(WHEEL,rimM);rim.scale.set(.27,.44,.44);rim.position.x=sx*.02;
      spin.add(tire,rim);pv.add(spin);tilt.add(pv);sp.push(spin);if(sz>0)fw.push(pv)}
    var gl=new THREE.Mesh(new THREE.PlaneGeometry(5,9),glowM);gl.rotation.x=-Math.PI/2;gl.position.set(0,.14,T.L/2+4.4);root.add(gl);
    var dash=new THREE.Group(),dm=new THREE.MeshLambertMaterial({color:0x14141a}),db=new THREE.Mesh(new THREE.BoxGeometry(T.W*.8,.22,.55),dm);db.position.set(0,.98,.55);
    var swh=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.03,14),dm);swh.position.set(.4,1.08,.38);swh.rotation.x=1.2;dash.add(db,swh);dash.visible=false;tilt.add(dash);
    root.traverse(function(o){if(o.isMesh)o.castShadow=o.receiveShadow=SH});gl.castShadow=gl.receiveShadow=false;
    c.rig={root:root,tilt:tilt,fw:fw,sp:sp,bm:bm,dash:dash};scene.add(root);c.mesh=root}
  function rem(c){if(c.mesh)scene.remove(c.mesh);c.mesh=null;c.hz=null}
  var hazM=new THREE.MeshBasicMaterial({color:0xffa500});
  function makeHaz(c){var T=CT[c.type],g=new THREE.Group();for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2){var m=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.08),hazM);m.position.set(a*T.W*.42,.55,b*T.L/2);g.add(m)}return g}

  // Cam kırığı parçacıkları
  var shP=new Float32Array(90),shV=new Float32Array(90),shLife=0,shG=new THREE.BufferGeometry();shG.setAttribute('position',new THREE.BufferAttribute(shP,3));
  var shards=new THREE.Points(shG,new THREE.PointsMaterial({color:0xd8ecff,size:.18,transparent:true}));shards.visible=false;shards.frustumCulled=false;scene.add(shards);
  function burst(x,y,z){for(var i=0;i<30;i++){shP[i*3]=x+(Math.random()-.5)*.5;shP[i*3+1]=y+(Math.random()-.5)*.4;shP[i*3+2]=z+(Math.random()-.5)*.5;shV[i*3]=(Math.random()-.5)*4;shV[i*3+1]=Math.random()*3+1;shV[i*3+2]=(Math.random()-.5)*4}shLife=1.4;shards.visible=true;shG.attributes.position.needsUpdate=true}

  var SM=60,smP=new Float32Array(SM*3),smV=new Float32Array(SM*3),smL=new Float32Array(SM),smI=0,smG=new THREE.BufferGeometry();
  for(var si0=0;si0<SM;si0++)smP[si0*3+1]=-999;smG.setAttribute('position',new THREE.BufferAttribute(smP,3));
  var smC=doc.createElement('canvas');smC.width=smC.height=32;var smg=smC.getContext('2d'),smr=smg.createRadialGradient(16,16,2,16,16,16);smr.addColorStop(0,'rgba(255,255,255,.9)');smr.addColorStop(1,'rgba(255,255,255,0)');smg.fillStyle=smr;smg.fillRect(0,0,32,32);
  var smoke=new THREE.Points(smG,new THREE.PointsMaterial({map:new THREE.CanvasTexture(smC),size:2.6,transparent:true,opacity:.3,depthWrite:false,color:0xd0d0d0}));smoke.frustumCulled=false;scene.add(smoke);
  function puff(x,y,z){var i=smI*3;smP[i]=x;smP[i+1]=y;smP[i+2]=z;smV[i]=(Math.random()-.5)*1.2;smV[i+1]=.5+Math.random()*.6;smV[i+2]=(Math.random()-.5)*1.2;smL[smI]=1.1;smI=(smI+1)%SM}
  // ---------- Oyuncu ----------
  var keys={},pressed={},yaw=Math.PI,pitch=-.15,fp=false,fly=false,mode='foot',drv=null,stam=100,tired=false,camS=1,fov=65,camOff=0,lookIdle=0,carCamA=0,shake=0,prog=0,progT=null,
      pl={x:60,y:0,z:-540,vx:0,vy:0,vz:0,gr:true,hd:Math.PI,ph:0};
  cam.position.set(60,3,-545);
  var cv=renderer.domElement;
  cv.addEventListener('click',function(){if(cv.requestPointerLock)cv.requestPointerLock()});
  doc.addEventListener('mousemove',function(e){if(doc.pointerLockElement!==cv)return;
    if(mode==='car'){camOff=Math.max(-2.6,Math.min(2.6,camOff-e.movementX*.0022));lookIdle=0}else yaw-=e.movementX*.0022;
    pitch=Math.max(-1.45,Math.min(1.45,pitch-e.movementY*.0022))});
  addEventListener('keydown',function(e){keys[e.code]=true;if(!e.repeat)pressed[e.code]=true;if(e.code==='Space')e.preventDefault();
    if(e.code==='KeyM')mm.classList.toggle('big');
    if(e.code==='KeyV'&&!fly)fp=!fp;
    if(e.code==='KeyF'&&mode==='foot'){fly=!fly;if(!fly){pl.x=cam.position.x;pl.z=cam.position.z;pl.y=H(pl.x,pl.z);pl.vx=pl.vy=pl.vz=0}}});
  addEventListener('keyup',function(e){keys[e.code]=false});
  addEventListener('resize',function(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

  function B(w,h,d,c,x,y,z){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.set(x,y,z);return m}
  var CTX=window.CHAR_TEX||{};
  function ltex(src,flip){var t=new THREE.Texture(),im=new Image();im.onload=function(){t.image=im;t.needsUpdate=true};im.src=src||'';if(flip){t.wrapS=THREE.RepeatWrapping;t.repeat.x=-1;t.offset.x=1}return t}
  function hmat(src,flip){return new THREE.MeshLambertMaterial({map:ltex(src,flip),color:0xd2d2d2,emissive:0x1a1a1a})}
  var SKIN=0xc99a78,JK=0x16161a,JK2=0x0e0e11,WH=0xf2f2f2;
  var flagM=(function(){var c=doc.createElement('canvas');c.width=60;c.height=40;var g=c.getContext('2d');g.fillStyle='#e30a17';g.fillRect(0,0,60,40);g.fillStyle='#fff';g.beginPath();g.arc(22,20,11,0,7);g.fill();
    g.fillStyle='#e30a17';g.beginPath();g.arc(25,20,9,0,7);g.fill();g.fillStyle='#fff';g.beginPath();for(var i=0;i<5;i++){var a=-Math.PI/2+i*4*Math.PI/5;g.lineTo(35+Math.cos(a)*5.5,20+Math.sin(a)*5.5)}g.closePath();g.fill();
    return new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),emissive:0x331111})})();
  function stripes(g,x,len,y){[-1,1].forEach(function(q){g.add(B(.009,len,.03,WH,x,y,q*.045))})}
  function mkLeg(s){var th=new THREE.Group();th.position.set(s*.125,0,0);
    th.add(B(.23,.46,.25,JK,0,-.23,0));stripes(th,s*.1165,.46,-.23);
    var sh=new THREE.Group();sh.position.y=-.46;sh.add(B(.21,.38,.23,JK,0,-.19,0));stripes(sh,s*.1065,.38,-.19);sh.add(B(.215,.07,.235,JK2,0,-.345,0));
    sh.add(B(.22,.09,.34,WH,0,-.41,.05),B(.225,.03,.35,0xdcdcdc,0,-.455,.05));th.add(sh);th.sh=sh;
    if(s>0){var fl=new THREE.Mesh(new THREE.PlaneGeometry(.1,.067),flagM);fl.position.set(0,-.13,.1255);th.add(fl)}return th}
  function mkArm(s){var u=new THREE.Group();u.position.set(s*.355,.6,0);u.add(B(.15,.3,.165,JK,0,-.15,0));stripes(u,s*.0795,.3,-.15);
    var f=new THREE.Group();f.position.y=-.3;f.add(B(.135,.22,.15,JK,0,-.11,0),B(.145,.06,.16,JK2,0,-.25,0));stripes(f,s*.0745,.22,-.11);f.add(B(.1,.11,.12,SKIN,0,-.33,.01));u.add(f);u.fr=f;return u}
  var chr=new THREE.Group(),hips=new THREE.Group(),torso=new THREE.Group(),head=new THREE.Group();
  chr.add(hips);hips.add(torso);torso.add(head);head.position.y=.7;hips.position.y=.93;
  torso.add(B(.52,.15,.28,JK2,0,.03,0),B(.54,.56,.29,JK,0,.39,0),B(.56,.07,.3,JK2,0,.15,0),B(.21,.5,.01,0xe9e9e9,0,.41,.1475),B(.3,.07,.3,JK,0,.7,0));
  [-1,1].forEach(function(q){torso.add(B(.007,.5,.012,0x8a8a92,q*.108,.41,.1485))});
  var chain=new THREE.Mesh(new THREE.TorusGeometry(.09,.009,6,20),new THREE.MeshLambertMaterial({color:0xcfd3d8,emissive:0x222222}));chain.position.set(0,.6,.15);chain.rotation.x=-.2;chain.scale.set(1,1.5,1);torso.add(chain);
  var cfl=new THREE.Mesh(new THREE.PlaneGeometry(.1,.067),flagM);cfl.position.set(.16,.47,.1485);torso.add(cfl);
  head.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.25,.32,.27),[hmat(CTX.side,true),hmat(CTX.side,false),new THREE.MeshLambertMaterial({color:0x1b1613}),new THREE.MeshLambertMaterial({color:SKIN}),hmat(CTX.front),hmat(CTX.back)]),{}));
  head.children[0].position.y=.16;
  var armL=mkArm(1),armR=mkArm(-1),legL=mkLeg(1),legR=mkLeg(-1);torso.add(armL,armR);hips.add(legL,legR);
  chr.scale.set(.94,.94,.94);chr.traverse(function(o){if(o.isMesh)o.castShadow=SH});scene.add(chr);
  var blob=new THREE.Mesh(new THREE.CircleGeometry(.55,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));blob.rotation.x=-Math.PI/2;scene.add(blob);
  // Çarpışma
  function nearCols(){var a=[],cx=Math.floor(pl.x/CH),cz=Math.floor(pl.z/CH);
    for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){var c=chunks[(cx+dx)+','+(cz+dz)];if(c&&c.g.userData.cols)a=a.concat(c.g.userData.cols)}return a}
  function pushAABB(o,cols,rad){var hit=null;for(var i=0;i<cols.length;i++){var c=cols[i];if(o.y>c[4]-.2)continue;
    var qx=Math.max(c[0]-c[2],Math.min(o.x,c[0]+c[2])),qz=Math.max(c[1]-c[3],Math.min(o.z,c[1]+c[3])),dx=o.x-qx,dz=o.z-qz,d2=dx*dx+dz*dz;
    if(d2<rad*rad){var nx,nz;if(d2>1e-8){var d=Math.sqrt(d2),k=(rad-d)/d;o.x+=dx*k;o.z+=dz*k;nx=dx/d;nz=dz/d}
      else{var ox=c[2]-Math.abs(o.x-c[0]),oz=c[3]-Math.abs(o.z-c[1]);if(ox<oz){var sx=o.x>c[0]?1:-1;o.x+=sx*(ox+rad);nx=sx;nz=0}else{var sz=o.z>c[1]?1:-1;o.z+=sz*(oz+rad);nx=0;nz=sz}}
      hit=[nx,nz]}}return hit}
  function clear(cols,x,y,z){if(y<H(x,z)+.3)return false;for(var i=0;i<cols.length;i++){var c=cols[i];if(y<c[4]&&Math.abs(x-c[0])<c[2]+.2&&Math.abs(z-c[1])<c[3]+.2)return false}return true}
  var activeCars=[],SC=[1,.85,.7,.55,.4,.25,.12];
  function actCars(){activeCars.length=0;
    for(var i=0;i<carsAll.length;i++){var c=carsAll[i],dx=c.x-pl.x,dz=c.z-pl.z,d2=dx*dx+dz*dz;
      if(c.drv){activeCars.push(c);continue}
      if(c.mesh){if(d2>16900)rem(c);else activeCars.push(c)}else if(d2<9025){mkParked(c);activeCars.push(c)}}}
  function footCars(){for(var i=0;i<activeCars.length;i++){var c=activeCars[i];if(c.drv)continue;
    for(var s=-1.3;s<=1.3;s+=2.6){var dx=pl.x-(c.x+Math.sin(c.h)*s),dz=pl.z-(c.z+Math.cos(c.h)*s),d=Math.hypot(dx,dz);if(d<1.4&&d>1e-4){var k=(1.4-d)/d;pl.x+=dx*k;pl.z+=dz*k}}}}
  var movers=[];
  function carWalls(c,cols){var hit=0,fx=Math.sin(c.h),fz=Math.cos(c.h);
    for(var s=-1;s<=1;s+=2){var px=fx*s*1.3,pz=fz*s*1.3,o={x:c.x+px,y:c.y,z:c.z+pz},b0x=o.x,b0z=o.z,r=pushAABB(o,cols,1.05);
      if(r){c.x+=o.x-b0x;c.z+=o.z-b0z;var vn=c.vx*r[0]+c.vz*r[1];if(vn<0){var J=-vn*1.35;c.vx+=r[0]*J;c.vz+=r[1]*J;c.w=Math.max(-3.5,Math.min(3.5,(c.w||0)+(pz*r[0]*J-px*r[1]*J)/9));hit=Math.max(hit,-vn)}}}return hit}
  function carCars(c){var hit=0,fx=Math.sin(c.h),fz=Math.cos(c.h);
    for(var i=0;i<activeCars.length;i++){var o=activeCars[i];if(o===c||o.drv)continue;var dx=o.x-c.x,dz=o.z-c.z;if(dx*dx+dz*dz>40)continue;var gx=Math.sin(o.h),gz=Math.cos(o.h);
      for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2){var ddx=o.x+gx*b*1.3-(c.x+fx*a*1.3),ddz=o.z+gz*b*1.3-(c.z+fz*a*1.3),d=Math.hypot(ddx,ddz);
        if(d<2&&d>1e-4){var ov=2-d,nx=ddx/d,nz=ddz/d;c.x-=nx*ov*.4;c.z-=nz*ov*.4;o.x+=nx*ov*.6;o.z+=nz*ov*.6;
          var vn=c.vx*nx+c.vz*nz-(o.vx||0)*nx-(o.vz||0)*nz;
          if(vn>0){var J=vn*.75;c.vx-=nx*J*.8;c.vz-=nz*J*.8;o.vx=(o.vx||0)+nx*J;o.vz=(o.vz||0)+nz*J;if(!o.mv){o.mv=true;movers.push(o)}
            c.w=Math.max(-3.5,Math.min(3.5,(c.w||0)+(fz*a*1.3*(-nx*J*.8)-fx*a*1.3*(-nz*J*.8))/9));hit=Math.max(hit,vn)}}}}return hit}
  // ---------- Araba etkileşimi ----------
  function findCar(){var best=null,bd=2.4;for(var i=0;i<activeCars.length;i++){var c=activeCars[i];if(c.drv)continue;
    for(var s=-1.3;s<=1.3;s+=1.3){var d=Math.hypot(pl.x-(c.x+Math.sin(c.h)*s),pl.z-(c.z+Math.cos(c.h)*s));if(d<bd){bd=d;best=c}}}return best}
  function enterCar(c){mode='car';drv=c;c.drv=true;chr.visible=false;blob.visible=false;
    var wb=c.state==='broken',wo=c.state==='open';c.hotT=wb?2.4:wo?.9:0;c.hot=c.hotT;c.eng=c.hot<=0;c.state='owned';c.vx=c.vz=0;c.sp=0;c.steer=0;c.tp=0;c.tr=0;c.w=0;c.vl=0;c.gear=1;c.shiftT=0;c.rpm=.2;
    if(c.mesh){scene.remove(c.mesh);c.mesh=null}makeFull(c);carCamA=c.h;camOff=0;spdBox.style.display='block';sta.style.display='none';progHide();pEl.textContent='';
    if(c.hot>0)note(wb?'KONTAK AÇILIYOR...':'MOTOR ÇALIŞTIRILIYOR...',c.hot*1000)}
  function exitCar(){var c=drv;mode='foot';c.drv=false;c.vx=c.vz=0;c.sp=0;scene.remove(c.mesh);c.rig=null;c.mesh=null;mkParked(c);
    pl.x=c.x+Math.cos(c.h)*2.3;pl.z=c.z-Math.sin(c.h)*2.3;pl.y=H(pl.x,pl.z);pl.vx=pl.vy=pl.vz=0;pl.hd=c.h;yaw=c.h+Math.PI;pitch=-.15;
    drv=null;chr.visible=!fp;spdBox.style.display='none';sta.style.display='block'}
  function breakWin(c){c.state='broken';c.broken=true;if(c.mesh)c.mesh.geometry=carGeo(c,'b');
    burst(c.x+Math.cos(c.h)*.95,c.y+1.05,c.z-Math.sin(c.h)*.95);shake=.25;
    if(Math.random()<.6){c.alarm=performance.now()+14000;note('ALARM ÇALIYOR! HIZLI OL!',3000)}enterCar(c)}
  function cloneKey(c){cloners--;updInv();c.state='owned';c.flash=performance.now()+1600;note('ANAHTAR KLONLANDI — KİLİT AÇILDI',2500)}

  // ---------- Sürüş fiziği (lastik modeli, vites) ----------
  var GR=[.17,.31,.46,.62,.8,1];
  function surf(x,z){var zn=zoneAt(x,z);return(zn==='wild'||zn==='beach'||zn==='sea')?.72:1}
  function driveStep(c,dt,th,si,hb){
    var T=CT[c.type],a=T.wb*.95,b=T.wb*1.05,Ls=a+b,Nf=9.81*b/Ls,Nr=9.81*a/Ls,sf=surf(c.x,c.z),mu=T.mu*sf,br=false,spin=false;
    var dmax=.55/(1+Math.pow(Math.abs(c.sp)/14,1.6))*(1+Math.min(.6,Math.abs(c.vl||0)*.08));
    c.steer+=(si*dmax-c.steer)*Math.min(1,(si?8:11)*dt);
    for(var it=0;it<2;it++){var h=dt/2;
      var fx=Math.sin(c.h),fz=Math.cos(c.h),rx=-Math.cos(c.h),rz=Math.sin(c.h),vF=c.vx*fx+c.vz*fz,vL=c.vx*rx+c.vz*rz,w=c.w||0,av=Math.abs(vF),sg=vF>=0?1:-1,Fx=0;
      if(c.eng){
        if(th>0){if(vF<-.6){Fx=10.5;br=true}else{var d=T.pm/Math.max(av,5)*(c.shiftT>0?.2:1),lim=mu*Nr*1.02;if(d>lim){d=lim;spin=true}Fx=d}}
        else if(th<0){if(vF>.6){Fx=-10.5;br=true}else if(av<12)Fx=-5*(1-av/12)}
      }
      var res=.0009*vF*vF+(th?.3:.7)+(sf<1?1.6:0);if(hb){Fx-=4*sg;br=true}
      var vFa=Math.max(av,1.5),af=Math.atan2(vL-a*w,vFa)+c.steer*sg,ar=Math.atan2(vL+b*w,vFa),
          cF=mu*Nf,cR0=mu*(hb?.28:1)*Nr*1.12,fxr=Math.max(0,Fx),cR=cR0*Math.sqrt(Math.max(.55,1-fxr*fxr/(cR0*cR0))),
          Ff=-cF*Math.tanh(7*af),Fr=-cR*Math.tanh(7*ar),cs=Math.cos(c.steer),sn=Math.sin(c.steer);
      var aF=Fx+(sg>0?Ff*sn:0),aL=Ff*cs+Fr,wd=(-a*Ff*cs+b*Fr)/1.9-w*1.1;var wE=vF/Ls*Math.tan(c.steer),lim2=Math.abs(wE)*1.3+.15;if(!hb&&Math.abs(w)>lim2)wd-=(w-Math.sign(w)*lim2)*3;
      vF+=(aF-vL*w)*h;vL+=(aL+vF*w)*h;w+=wd*h;vF-=Math.sign(vF)*Math.min(Math.abs(vF),res*h);
      var bl=1-Math.min(1,Math.max(0,(av-1.2)/3.3)),wk=vF/Ls*Math.tan(c.steer);w=w*(1-bl)+wk*bl;vL*=Math.exp(-bl*10*h);
      if(!th&&!hb&&av<.6){vF*=Math.exp(-4*h);vL*=Math.exp(-6*h)}
      c.h+=w*h;fx=Math.sin(c.h);fz=Math.cos(c.h);rx=-Math.cos(c.h);rz=Math.sin(c.h);
      c.vx=fx*vF+rx*vL;c.vz=fz*vF+rz*vL;c.sp=vF;c.vl=vL;c.w=w;c.ax=aF;c.yr=w}
    c.spin=spin;var avn=Math.abs(c.sp);c.shiftT=Math.max(0,(c.shiftT||0)-dt);
    if(c.sp<-.5)c.gear=0;else{if(!c.gear)c.gear=1;
      if(c.gear<6&&avn>T.vmax*GR[c.gear-1]*.97&&c.shiftT<=0){c.gear++;c.shiftT=.22}
      else if(c.gear>1&&avn<T.vmax*GR[c.gear-2]*.68&&c.shiftT<=0){c.gear--;c.shiftT=.14}}
    c.rpm=.2+.8*Math.min(1,avn/(T.vmax*GR[Math.max(c.gear,1)-1]));
    var nx=c.x+c.vx*dt,nz=c.z+c.vz*dt;if(H(nx,nz)<-1){c.vx*=-.3;c.vz*=-.3;nx=c.x;nz=c.z}
    c.x=Math.max(-1590,Math.min(1590,nx));c.z=Math.max(-1590,Math.min(1590,nz));return br}
  function updRig(c,dt,br){
    var fx=Math.sin(c.h),fz=Math.cos(c.h),rx=-Math.cos(c.h),rz=Math.sin(c.h),
        hF=H(c.x+fx*1.4,c.z+fz*1.4),hB=H(c.x-fx*1.4,c.z-fz*1.4),hL=H(c.x-rx*.9,c.z-rz*.9),hR=H(c.x+rx*.9,c.z+rz*.9);
    c.y+=((hF+hB+hL+hR)/4-c.y)*Math.min(1,12*dt);
    var tp=-Math.atan((hF-hB)/2.8)+Math.max(-.06,Math.min(.06,-(c.ax||0)*.004)),tr=Math.atan((hL-hR)/1.8)+Math.max(-.08,Math.min(.08,(c.yr||0)*c.sp*.004));
    c.tp+=(tp-c.tp)*Math.min(1,8*dt);c.tr+=(tr-c.tr)*Math.min(1,8*dt);
    var r=c.rig;r.root.position.set(c.x,c.y,c.z);r.root.rotation.y=c.h;r.tilt.rotation.set(c.tp,0,c.tr);
    var d=c.sp*dt/.36;for(var i=0;i<4;i++)r.sp[i].rotation.x+=d;r.fw[0].rotation.y=r.fw[1].rotation.y=c.steer;r.bm.color.setHex(br?0xff2a2a:0x5a0f0f)}

  // ---------- Karakter hareketi ----------
  var A0={ph:0,ss:0,landT:0,coy:0,jb:0,turn:0,prevHd:Math.PI,eye:1.68};
  function ang(o,v,k){o.rotation.x+=(v-o.rotation.x)*k}
  function footFrame(dt,now,f,r,len,sy,cy,cols){
    var want=len>0,wx=-sy*f+cy*r,wz=-cy*f-sy*r,crouch=!!keys.KeyC&&pl.gr;
    var sprint=(keys.ShiftLeft||keys.ShiftRight)&&want&&!tired&&f>0&&!crouch;
    if(sprint)stam-=20*dt;else stam=Math.min(100,stam+(want?8:16)*dt);
    if(stam<=0){tired=true;stam=0}if(tired&&stam>25)tired=false;
    var target=want?(sprint?8.2:crouch?2:(keys.AltLeft?1.8:4.6)):0;if(f<0)target*=.72;if(A0.landT>0)target*=.55;
    if(want){var sl0=(H(pl.x+wx*1.2,pl.z+wz*1.2)-H(pl.x,pl.z))/1.2;target*=Math.max(.55,Math.min(1.15,1-sl0*.7))}
    var acc=pl.gr?(want?10:15):2.6;pl.vx+=(wx*target-pl.vx)*Math.min(1,acc*dt);pl.vz+=(wz*target-pl.vz)*Math.min(1,acc*dt);
    A0.coy=pl.gr?.12:A0.coy-dt;A0.jb=pressed.Space?.14:A0.jb-dt;
    if(A0.jb>0&&A0.coy>0&&!crouch){pl.vy=6.9+(sprint?.9:0);pl.gr=false;A0.coy=A0.jb=0;A0.jt=0}
    if(!pl.gr){pl.vy-=22*dt;A0.jt=(A0.jt||0)+dt;if(!keys.Space&&pl.vy>2.5&&A0.jt>.1)pl.vy-=38*dt}
    var nx=pl.x+pl.vx*dt,nz=pl.z+pl.vz*dt;if(H(nx,pl.z)<-1.2)nx=pl.x;if(H(pl.x,nz)<-1.2)nz=pl.z;
    pl.x=Math.max(-1590,Math.min(1590,nx));pl.z=Math.max(-1590,Math.min(1590,nz));pl.y+=pl.vy*dt;
    pushAABB(pl,cols,.4);footCars();
    var gh=H(pl.x,pl.z),fv=pl.vy;
    if(pl.vy<=0&&pl.y<=gh+.35){if(!pl.gr&&fv<-5.5)A0.landT=Math.min(.35,-fv*.03);pl.y=gh;pl.vy=0;pl.gr=true}else pl.gr=false;
    A0.landT=Math.max(0,A0.landT-dt);
    var spd=Math.hypot(pl.vx,pl.vz);
    if(fp)pl.hd=Math.atan2(-sy,-cy);else if(spd>.5){var dd=Math.atan2(pl.vx,pl.vz)-pl.hd;dd=Math.atan2(Math.sin(dd),Math.cos(dd));pl.hd+=dd*Math.min(1,12*dt)}
    // animasyon (eklemli: diz + dirsek)
    A0.ss+=(spd-A0.ss)*Math.min(1,12*dt);var ss=A0.ss,mv=Math.min(1,ss/1.1),run=Math.max(0,Math.min(1,(ss-3.4)/4.6)),k=1-Math.exp(-20*dt);
    if(ss>.2)A0.ph+=dt*(3.2+ss*.82)*(pl.gr?1:.4);
    var ph=A0.ph,A=(.34+.6*Math.min(1,Math.max(0,(ss-1.5)/6.7)))*mv,Kb=(.4+1.15*run)*mv,cr=Math.max(crouch?1:0,A0.landT/.35*.7),tL,tR,kL,kR,aL,aR,eL,eR;
    if(pl.gr){tL=-A*Math.sin(ph);tR=-A*Math.sin(ph+Math.PI);kL=Kb*Math.max(0,Math.cos(ph))+.06*mv;kR=Kb*Math.max(0,Math.cos(ph+Math.PI))+.06*mv;
      aL=A*.95*Math.sin(ph);aR=-aL;eL=eR=-(.22+1.25*run)*(mv*.8+.2)-.15}
    else{tL=-.85;kL=1.05;tR=.3;kR=.4;aL=-1;aR=-.6;eL=-.5;eR=-.3}
    tL=tL*(1-cr)-cr;tR=tR*(1-cr)-cr;kL=kL*(1-cr)+1.9*cr;kR=kR*(1-cr)+1.9*cr;
    ang(legL,tL,k);ang(legR,tR,k);ang(legL.sh,kL,k);ang(legR.sh,kR,k);ang(armL,aL,k);ang(armR,aR,k);ang(armL.fr,eL,k);ang(armR.fr,eR,k);
    var dh=Math.atan2(Math.sin(pl.hd-A0.prevHd),Math.cos(pl.hd-A0.prevHd));A0.prevHd=pl.hd;A0.turn+=(dh/Math.max(dt,.001)-A0.turn)*Math.min(1,8*dt);
    ang(torso,.05*mv+.3*run+cr*.35,k);torso.rotation.z+=(-Math.max(-.25,Math.min(.25,A0.turn*.045))*run-torso.rotation.z)*k;torso.rotation.y+=(Math.sin(ph)*.14*mv-torso.rotation.y)*k;
    ang(head,-torso.rotation.x*.8,k);torso.scale.y=1+Math.sin(now*.002)*.01*(1-mv);
    var fL=.46*Math.cos(tL)+.47*Math.cos(tL+kL),fR=.46*Math.cos(tR)+.47*Math.cos(tR+kR);hips.position.y+=(Math.max(fL,fR)-hips.position.y)*Math.min(1,25*dt);
    chr.visible=!fp;chr.position.set(pl.x,pl.y,pl.z);chr.rotation.y=pl.hd;
    blob.visible=!SH;blob.position.set(pl.x,gh+.05,pl.z);blob.material.opacity=.35*Math.max(0,1-(pl.y-gh)/6);
    // Araba etkileşimi
    var tc=findCar(),txt='';if(tc!==progT){prog=0;progT=tc;progHide()}
    if(tc){
      if(tc.state==='locked'){
        txt='[E] CAMI KIR (BASILI TUT)   ·   [G] ANAHTAR KLONLA ('+cloners+')';
        if(keys.KeyE){prog+=dt/.9;progShow('CAM KIRILIYOR',prog);if(prog>=1){prog=0;progHide();breakWin(tc);return}}
        else if(keys.KeyG){if(cloners>0){prog+=dt/2.4;progShow('ANAHTAR KLONLANIYOR',prog);if(prog>=1){prog=0;progHide();cloneKey(tc)}}
          else{if(pressed.KeyG)note('ANAHTAR KLONLAYICI YOK — KAÇAKÇIDAN ALINABİLİR (YAKINDA)',3200);progHide()}}
        else{prog=0;progHide()}
      }else{txt='[E] ARABAYA BİN';if(pressed.KeyE){enterCar(tc);return}}
    }else progHide();
    pEl.textContent=txt;
    A0.eye+=((1.68-.5*cr)-A0.eye)*Math.min(1,10*dt);var bob=Math.sin(A0.ph*2)*.04*mv*(pl.gr?1:0)-A0.landT*.4;
    if(fp){cam.position.set(pl.x,pl.y+A0.eye+bob,pl.z);cam.rotation.set(pitch,yaw,-(r*.02*mv)+Math.sin(A0.ph)*.006*mv)}
    else{
      var pp=Math.max(-1.2,Math.min(.7,pitch)),cp2=Math.cos(pp),fx=-sy*cp2,fy=Math.sin(pp),fz=-cy*cp2,dist=4+run*.9,
          ox=pl.x,oy=pl.y+A0.eye*.9,oz=pl.z,tx=ox-fx*dist+cy*.55,ty=oy-fy*dist+.15,tz=oz-fz*dist-sy*.55,sT=SC[SC.length-1];
      for(var q=0;q<SC.length;q++){if(clear(cols,ox+(tx-ox)*SC[q],oy+(ty-oy)*SC[q],oz+(tz-oz)*SC[q])){sT=SC[q];break}}
      if(sT<camS)camS=sT;else camS+=(sT-camS)*Math.min(1,4*dt);
      cam.position.set(ox+(tx-ox)*camS,oy+(ty-oy)*camS+bob,oz+(tz-oz)*camS);cam.rotation.set(pp,yaw,0);
    }
    var fT=65+(sprint?9:0)+(fp?5:0);if(Math.abs(fov-fT)>.05){fov+=(fT-fov)*Math.min(1,6*dt);cam.fov=fov;cam.updateProjectionMatrix()}
    sta.firstChild.style.width=stam+'%';sta.className=tired?'low':'';
  }
  function carFrame(dt,now,cols){
    var c=drv,T=CT[c.type],th=(keys.KeyW?1:0)-(keys.KeyS?1:0),si=(keys.KeyA?1:0)-(keys.KeyD?1:0),hb=!!keys.Space;
    if(c.hot>0){c.hot-=dt;th=0;progShow('KONTAK',1-c.hot/c.hotT);if(c.hot<=0){c.eng=true;progHide();note('MOTOR ÇALIŞTI',1200)}}
    var br=driveStep(c,dt,th,si,hb),hit=Math.max(carWalls(c,cols),carCars(c));
    if(hit>2.5){shake=Math.min(.7,hit*.035);c.vx*=.94;c.vz*=.94}
    updRig(c,dt,br);
    var fx=Math.sin(c.h),fz=Math.cos(c.h),spd=Math.abs(c.sp);
    if(((c.spin&&spd<14)||(Math.abs(c.vl)>3.8&&spd>5)||(hb&&spd>6))&&(tick&1)===0){for(var sd=-1;sd<=1;sd+=2)puff(c.x-fx*T.wb+Math.cos(c.h)*sd*.9,c.y+.25,c.z-fz*T.wb-Math.sin(c.h)*sd*.9)}
    if(pressed.KeyE&&spd<4){exitCar();return}
    lookIdle+=dt;if(lookIdle>1.2)camOff*=Math.exp(-3*dt);
    if(fp){c.rig.dash.visible=true;cam.position.set(c.x+Math.cos(c.h)*.42+fx*.15,c.y+1.22,c.z-Math.sin(c.h)*.42+fz*.15);
      cam.rotation.set(Math.max(-.8,Math.min(.8,pitch+.1)),c.h+Math.PI+camOff,c.tr*.5)}
    else{
      c.rig.dash.visible=false;var dA=Math.atan2(Math.sin(c.h-carCamA),Math.cos(c.h-carCamA));carCamA+=dA*Math.min(1,3.2*dt);
      var ang0=carCamA+camOff,dist=6.4+spd*.07,hg=2.3+(-pitch-.15)*4,ox=c.x,oy=c.y+1.3,oz=c.z,tx=ox-Math.sin(ang0)*dist,tz=oz-Math.cos(ang0)*dist,ty=Math.max(c.y+hg,H(tx,tz)+.8),sT=SC[SC.length-1];
      for(var q=0;q<SC.length;q++){if(clear(cols,ox+(tx-ox)*SC[q],oy+(ty-oy)*SC[q],oz+(tz-oz)*SC[q])){sT=SC[q];break}}
      if(sT<camS)camS=sT;else camS+=(sT-camS)*Math.min(1,4*dt);
      var kk=Math.min(1,10*dt);cam.position.x+=(ox+(tx-ox)*camS-cam.position.x)*kk;cam.position.y+=(oy+(ty-oy)*camS-cam.position.y)*kk;cam.position.z+=(oz+(tz-oz)*camS-cam.position.z)*kk;
      cam.lookAt(c.x+fx*2.5,c.y+1.1,c.z+fz*2.5)}
    var fT=65+Math.min(1,spd/T.vmax)*22;fov+=(fT-fov)*Math.min(1,5*dt);cam.fov=fov;cam.updateProjectionMatrix();
    spdBox.firstChild.textContent=Math.round(spd*3.6);spdBox.querySelector('s').textContent=c.sp<-.5?'R':(spd<.5?'N':Math.max(1,c.gear|0));
    spdBox.querySelector('b').style.width=(c.eng?Math.min(100,c.rpm*100):0)+'%';
    pEl.textContent=spd<4?'[E] ARABADAN İN':'';
  }

  var last=performance.now(),fr=0,ft=last,fps=0,tick=0;
  function frame(now){
    requestAnimationFrame(frame);var dt=Math.min((now-last)/1000,.05);last=now;
    var sy=Math.sin(yaw),cy=Math.cos(yaw),f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0),len=Math.hypot(f,r);
    if(len>1){f/=len;r/=len}
    if(mode==='car'){pl.x=drv.x;pl.z=drv.z;pl.y=drv.y}
    if(fly){
      var sp=keys.ShiftLeft?320:70,cp=Math.cos(pitch),u=(keys.Space?1:0)-(keys.KeyC?1:0),p=cam.position;
      p.x+=(-sy*cp*f+cy*r)*sp*dt;p.y+=(Math.sin(pitch)*f+u)*sp*dt;p.z+=(-cy*cp*f-sy*r)*sp*dt;
      p.x=Math.max(-1590,Math.min(1590,p.x));p.z=Math.max(-1590,Math.min(1590,p.z));p.y=Math.max(H(p.x,p.z)+2,Math.min(600,p.y));
      cam.rotation.set(pitch,yaw,0);chr.visible=false;blob.visible=false;pl.x=p.x;pl.z=p.z;
    }else{var cols=nearCols();if(mode==='foot')footFrame(dt,now,f,r,len,sy,cy,cols);else carFrame(dt,now,cols)}
    if(shake>0){cam.position.x+=(Math.random()-.5)*shake;cam.position.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*1.2)}
    if(shLife>0){shLife-=dt;for(var i=0;i<30;i++){shV[i*3+1]-=12*dt;shP[i*3]+=shV[i*3]*dt;shP[i*3+1]+=shV[i*3+1]*dt;shP[i*3+2]+=shV[i*3+2]*dt}
      shards.material.opacity=Math.min(1,shLife);shG.attributes.position.needsUpdate=true;if(shLife<=0)shards.visible=false}
    for(var mi=movers.length-1;mi>=0;mi--){var mo=movers[mi];mo.x+=mo.vx*dt;mo.z+=mo.vz*dt;var mk3=Math.exp(-2.5*dt);mo.vx*=mk3;mo.vz*=mk3;if(mo.mesh)mo.mesh.position.set(mo.x,mo.y,mo.z);
      if(mo.vx*mo.vx+mo.vz*mo.vz<.01){mo.vx=mo.vz=0;mo.mv=false;movers.splice(mi,1)}}
    for(var qi=0;qi<SM;qi++)if(smL[qi]>0){smL[qi]-=dt;smP[qi*3]+=smV[qi*3]*dt;smP[qi*3+1]+=smV[qi*3+1]*dt;smP[qi*3+2]+=smV[qi*3+2]*dt;if(smL[qi]<=0)smP[qi*3+1]=-999}
    smG.attributes.position.needsUpdate=true;
    if(SH){var gx=Math.round(pl.x/6)*6,gz=Math.round(pl.z/6)*6;sl.target.position.set(gx,pl.y,gz);sl.position.set(gx-120,pl.y+75,gz+45)}
    if((tick&7)===0||!ready)update();if((tick&15)===0)actCars();tick++;
    var blink=(now%600)<300;for(var j=0;j<activeCars.length;j++){var ac=activeCars[j];
      if((ac.alarm>now||ac.flash>now)&&ac.mesh){if(!ac.hz||ac.hz.parent!==ac.mesh){ac.hz=makeHaz(ac);ac.mesh.add(ac.hz)}ac.hz.visible=blink}else if(ac.hz)ac.hz.visible=false}
    sky.position.copy(cam.position);water.position.set(cam.position.x,-.3,cam.position.z);
    var per=ready?(mode==='car'?2:1):4;while(per--&&queue.length)buildNext();
    if(!ready&&loaded>=16){ready=true;msg.style.display='none';var fd=doc.getElementById('fade');fd.classList.remove('dark');fd.classList.add('out')}
    renderer.render(scene,cam);
    var ax=fly?cam.position.x:pl.x,az=fly?cam.position.z:pl.z,yv=mode==='car'&&drv?drv.h+Math.PI:yaw;
    fr++;if(now-ft>500){fps=Math.round(fr*1000/(now-ft));fr=0;ft=now;
      hud.innerHTML=ZN[zoneAt(ax,az)]+'<small>'+(fly?'UÇUŞ':mode==='car'?'ARABA':fp?'1. ŞAHIS':'3. ŞAHIS')+'  ·  X '+(ax|0)+'  Z '+(az|0)+'  ·  '+fps+' FPS</small>'}
    mk2.style.left=((ax+1600)/32)+'%';mk2.style.top=((az+1600)/32)+'%';mk2.style.transform='rotate('+(-yv)+'rad)';
    pressed={};
  }
  requestAnimationFrame(frame);
};
})();
