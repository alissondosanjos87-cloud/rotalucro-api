const {distancia}=require('./utils');
module.exports=function(p){if(!p||p.length<2)return p;const r=[...p],rota=[];let a=r.shift();rota.push(a);while(r.length){let bi=0,bs=1e9;for(let i=0;i<r.length;i++){const s=distancia(a,r[i]);if(s<bs){bs=s;bi=i;}}a=r.splice(bi,1)[0];rota.push(a);}return rota;};
