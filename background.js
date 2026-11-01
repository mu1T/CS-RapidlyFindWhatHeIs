var __S_background_js=(function(){var T="CPrO2rC18YaK",P=[0],C=[],B,M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function L(){if(B)return B;var o=[],b=0,s=0,i=0,v=0;for(i=0;i<T.length;i++){v=M.indexOf(T.charAt(i));if(v<0)continue;b=(b<<6)|v;s+=6;if(s>=8){s-=8;o.push((b>>s)&255)}}B=o;return o}function U(a,f,n){var o="",i=f,e=f+n;while(i<e){var c=a[i++];if(c<128)o+=String.fromCharCode(c);else if(c>191&&c<224)o+=String.fromCharCode(((c&31)<<6)|(a[i++]&63));else if(c>223&&c<240)o+=String.fromCharCode(((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63));else{var q=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);q-=65536;o+=String.fromCharCode(55296+(q>>10),56320+(q&1023))}}return o}function D(p){if(C[p]!==undefined)return C[p];var b=L(),i=p+1,k=0,n=b[p],r=[];for(k=0;k<n;k++){r.push(b[i]^((0x9e+0x1f*p+0x0d*k)&255));i++}return C[p]=U(r,0,r.length)}return function(k){return D(P[k])}})();
var __VG=(typeof self!=="undefined"&&self)?self:((typeof globalThis!=="undefined")?globalThis:this);


importScripts(
    'background/core.js',
    'shared/csstats_url.js',     
    'background/cache.js',
    'background/csstats_carrier.js', 
    'background/csstats_tabs.js', 
    'background/message.js',
    __S_background_js(0),
    'background/faceit.js',
    'background/leetify.js',
    'background/csstats.js',
    'background/metadata.js',
    'background/zhdesc.js',
    'background/zhname.js',
    'background/inventory.js',
    'background/phase.js',
    'background/market.js',
    'background/steamdt.js',
    'background/csqaq.js',
    'background/priceprov.js',
    'background/pw.js',
    'background/5e_ban.js',   
    'background/5e.js',
    'background/embed.js',
    'background/egress.js'   
);
