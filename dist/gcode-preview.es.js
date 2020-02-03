<<<<<<< HEAD
import{UniformsLib as t,Vector2 as e,ShaderLib as n,UniformsUtils as i,ShaderMaterial as r,InstancedBufferGeometry as s,InstancedInterleavedBuffer as a,InterleavedBufferAttribute as o,WireframeGeometry as c,Box3 as l,Vector3 as u,Sphere as d,Float32BufferAttribute as h,Mesh as p,Vector4 as f,Matrix4 as m,Line3 as v,MathUtils as y,Scene as g,Color as x,WebGLRenderer as b,PerspectiveCamera as w,Group as S,Euler as z,BufferGeometry as L,LineBasicMaterial as E,LineSegments as A}from"three";import*as _ from"three-orbitcontrols";class C extends class{constructor(t,e){this.gcode=t,this.comment=e}}{constructor(t,e,n){super(t,n),this.params=e}}class M{constructor(t,e){this.layer=t,this.commands=e}}class B{constructor(){this.layers=[],this.curZ=0,this.maxZ=0}parseCommand(t,e=!0){const n=t.trim().split(";"),i=n[0],r=e&&n[1]||null,s=i.split(/ +/g),a=s[0].toLowerCase();switch(a){case"g0":case"g1":const t=this.parseMove(s.slice(1));return new C(a,t,r);default:return null}}parseMove(t){return t.reduce((t,e)=>{const n=e.charAt(0).toLowerCase();return"x"!=n&&"y"!=n&&"z"!=n&&"e"!=n||(t[n]=parseFloat(e.slice(1))),t},{})}groupIntoLayers(t){for(const e of t.filter(t=>t instanceof C)){const t=e.params;t.z&&(this.curZ=t.z),t.e>0&&this.curZ>this.maxZ?(this.maxZ=this.curZ,this.currentLayer=new M(this.layers.length,[e]),this.layers.push(this.currentLayer)):this.currentLayer&&this.currentLayer.commands.push(e)}return this.layers}parseGcode(t){const e=Array.isArray(t)?t:t.split("\n").filter(t=>t.length>0),n=this.lines2commands(e);return this.groupIntoLayers(n),{layers:this.layers}}lines2commands(t){return t.filter(t=>t.length>0).map(t=>this.parseCommand(t)).filter(t=>null!==t)}}t.line={linewidth:{value:1},resolution:{value:new e(1,1)},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},n.line={uniforms:i.merge([t.common,t.fog,t.line]),vertexShader:"\n\t\t#include <common>\n\t\t#include <color_pars_vertex>\n\t\t#include <fog_pars_vertex>\n\t\t#include <logdepthbuf_pars_vertex>\n\t\t#include <clipping_planes_pars_vertex>\n\n\t\tuniform float linewidth;\n\t\tuniform vec2 resolution;\n\n\t\tattribute vec3 instanceStart;\n\t\tattribute vec3 instanceEnd;\n\n\t\tattribute vec3 instanceColorStart;\n\t\tattribute vec3 instanceColorEnd;\n\n\t\tvarying vec2 vUv;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashScale;\n\t\t\tattribute float instanceDistanceStart;\n\t\t\tattribute float instanceDistanceEnd;\n\t\t\tvarying float vLineDistance;\n\n\t\t#endif\n\n\t\tvoid trimSegment( const in vec4 start, inout vec4 end ) {\n\n\t\t\t// trim end segment so it terminates between the camera plane and the near plane\n\n\t\t\t// conservative estimate of the near plane\n\t\t\tfloat a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column\n\t\t\tfloat b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column\n\t\t\tfloat nearEstimate = - 0.5 * b / a;\n\n\t\t\tfloat alpha = ( nearEstimate - start.z ) / ( end.z - start.z );\n\n\t\t\tend.xyz = mix( start.xyz, end.xyz, alpha );\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\t#ifdef USE_COLOR\n\n\t\t\t\tvColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;\n\n\t\t\t#endif\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;\n\n\t\t\t#endif\n\n\t\t\tfloat aspect = resolution.x / resolution.y;\n\n\t\t\tvUv = uv;\n\n\t\t\t// camera space\n\t\t\tvec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );\n\t\t\tvec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\n\t\t\t// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n\t\t\t// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space\n\t\t\t// but we need to perform ndc-space calculations in the shader, so we must address this issue directly\n\t\t\t// perhaps there is a more elegant solution -- WestLangley\n\n\t\t\tbool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column\n\n\t\t\tif ( perspective ) {\n\n\t\t\t\tif ( start.z < 0.0 && end.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( start, end );\n\n\t\t\t\t} else if ( end.z < 0.0 && start.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( end, start );\n\n\t\t\t\t}\n\n\t\t\t}\n\n\t\t\t// clip space\n\t\t\tvec4 clipStart = projectionMatrix * start;\n\t\t\tvec4 clipEnd = projectionMatrix * end;\n\n\t\t\t// ndc space\n\t\t\tvec2 ndcStart = clipStart.xy / clipStart.w;\n\t\t\tvec2 ndcEnd = clipEnd.xy / clipEnd.w;\n\n\t\t\t// direction\n\t\t\tvec2 dir = ndcEnd - ndcStart;\n\n\t\t\t// account for clip-space aspect ratio\n\t\t\tdir.x *= aspect;\n\t\t\tdir = normalize( dir );\n\n\t\t\t// perpendicular to dir\n\t\t\tvec2 offset = vec2( dir.y, - dir.x );\n\n\t\t\t// undo aspect ratio adjustment\n\t\t\tdir.x /= aspect;\n\t\t\toffset.x /= aspect;\n\n\t\t\t// sign flip\n\t\t\tif ( position.x < 0.0 ) offset *= - 1.0;\n\n\t\t\t// endcaps\n\t\t\tif ( position.y < 0.0 ) {\n\n\t\t\t\toffset += - dir;\n\n\t\t\t} else if ( position.y > 1.0 ) {\n\n\t\t\t\toffset += dir;\n\n\t\t\t}\n\n\t\t\t// adjust for linewidth\n\t\t\toffset *= linewidth;\n\n\t\t\t// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n\t\t\toffset /= resolution.y;\n\n\t\t\t// select end\n\t\t\tvec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;\n\n\t\t\t// back to clip space\n\t\t\toffset *= clip.w;\n\n\t\t\tclip.xy += offset;\n\n\t\t\tgl_Position = clip;\n\n\t\t\tvec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation\n\n\t\t\t#include <logdepthbuf_vertex>\n\t\t\t#include <clipping_planes_vertex>\n\t\t\t#include <fog_vertex>\n\n\t\t}\n\t\t",fragmentShader:"\n\t\tuniform vec3 diffuse;\n\t\tuniform float opacity;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashSize;\n\t\t\tuniform float gapSize;\n\n\t\t#endif\n\n\t\tvarying float vLineDistance;\n\n\t\t#include <common>\n\t\t#include <color_pars_fragment>\n\t\t#include <fog_pars_fragment>\n\t\t#include <logdepthbuf_pars_fragment>\n\t\t#include <clipping_planes_pars_fragment>\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\t#include <clipping_planes_fragment>\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tif ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps\n\n\t\t\t\tif ( mod( vLineDistance, dashSize + gapSize ) > dashSize ) discard; // todo - FIX\n\n\t\t\t#endif\n\n\t\t\tif ( abs( vUv.y ) > 1.0 ) {\n\n\t\t\t\tfloat a = vUv.x;\n\t\t\t\tfloat b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;\n\t\t\t\tfloat len2 = a * a + b * b;\n\n\t\t\t\tif ( len2 > 1.0 ) discard;\n\n\t\t\t}\n\n\t\t\tvec4 diffuseColor = vec4( diffuse, opacity );\n\n\t\t\t#include <logdepthbuf_fragment>\n\t\t\t#include <color_fragment>\n\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );\n\n\t\t\t#include <tonemapping_fragment>\n\t\t\t#include <encodings_fragment>\n\t\t\t#include <fog_fragment>\n\t\t\t#include <premultiplied_alpha_fragment>\n\n\t\t}\n\t\t"};var j=function(t){r.call(this,{type:"LineMaterial",uniforms:i.clone(n.line.uniforms),vertexShader:n.line.vertexShader,fragmentShader:n.line.fragmentShader,clipping:!0}),this.dashed=!1,Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}}}),this.setValues(t)};(j.prototype=Object.create(r.prototype)).constructor=j,j.prototype.isLineMaterial=!0;var P,D,U=function(){s.call(this),this.type="LineSegmentsGeometry";this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new h([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new h([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))};U.prototype=Object.assign(Object.create(s.prototype),{constructor:U,isLineSegmentsGeometry:!0,applyMatrix4:function(t){var e=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==e&&(e.applyMatrix4(t),n.applyMatrix4(t),e.data.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this},setPositions:function(t){var e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));var n=new a(e,6,1);return this.setAttribute("instanceStart",new o(n,3,0)),this.setAttribute("instanceEnd",new o(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this},setColors:function(t){var e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));var n=new a(e,6,1);return this.setAttribute("instanceColorStart",new o(n,3,0)),this.setAttribute("instanceColorEnd",new o(n,3,3)),this},fromWireframeGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromEdgesGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromMesh:function(t){return this.fromWireframeGeometry(new c(t.geometry)),this},fromLineSegements:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},computeBoundingBox:(D=new l,function(){null===this.boundingBox&&(this.boundingBox=new l);var t=this.attributes.instanceStart,e=this.attributes.instanceEnd;void 0!==t&&void 0!==e&&(this.boundingBox.setFromBufferAttribute(t),D.setFromBufferAttribute(e),this.boundingBox.union(D))}),computeBoundingSphere:(P=new u,function(){null===this.boundingSphere&&(this.boundingSphere=new d),null===this.boundingBox&&this.computeBoundingBox();var t=this.attributes.instanceStart,e=this.attributes.instanceEnd;if(void 0!==t&&void 0!==e){var n=this.boundingSphere.center;this.boundingBox.getCenter(n);for(var i=0,r=0,s=t.count;r<s;r++)P.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(P)),P.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(P));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}),toJSON:function(){},applyMatrix:function(t){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(t)}});var G=function(){U.call(this),this.type="LineGeometry"};G.prototype=Object.assign(Object.create(U.prototype),{constructor:G,isLineGeometry:!0,setPositions:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return U.prototype.setPositions.call(this,n),this},setColors:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return U.prototype.setColors.call(this,n),this},fromLine:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},copy:function(){return this}});var T,F,I=function(t,e){p.call(this),this.type="LineSegments2",this.geometry=void 0!==t?t:new U,this.material=void 0!==e?e:new j({color:16777215*Math.random()})};I.prototype=Object.assign(Object.create(p.prototype),{constructor:I,isLineSegments2:!0,computeLineDistances:(T=new u,F=new u,function(){for(var t=this.geometry,e=t.attributes.instanceStart,n=t.attributes.instanceEnd,i=new Float32Array(2*e.data.count),r=0,s=0,c=e.data.count;r<c;r++,s+=2)T.fromBufferAttribute(e,r),F.fromBufferAttribute(n,r),i[s]=0===s?0:i[s-1],i[s+1]=i[s]+T.distanceTo(F);var l=new a(i,2,1);return t.setAttribute("instanceDistanceStart",new o(l,1,0)),t.setAttribute("instanceDistanceEnd",new o(l,1,1)),this}),raycast:function(){var t=new f,e=new f,n=new f,i=new u,r=new m,s=new v,a=new u;return function(o,c){null===o.camera&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2.');var l=o.ray,d=o.camera,h=d.projectionMatrix,p=this.geometry,f=this.material,m=f.resolution,v=f.linewidth,g=p.attributes.instanceStart,x=p.attributes.instanceEnd;l.at(1,n),n.w=1,n.applyMatrix4(d.matrixWorldInverse),n.applyMatrix4(h),n.multiplyScalar(1/n.w),n.x*=m.x/2,n.y*=m.y/2,n.z=0,i.copy(n);var b=this.matrixWorld;r.multiplyMatrices(d.matrixWorldInverse,b);for(var w=0,S=g.count;w<S;w++){t.fromBufferAttribute(g,w),e.fromBufferAttribute(x,w),t.w=1,e.w=1,t.applyMatrix4(r),e.applyMatrix4(r),t.applyMatrix4(h),e.applyMatrix4(h),t.multiplyScalar(1/t.w),e.multiplyScalar(1/e.w);var z=t.z<-1&&e.z<-1,L=t.z>1&&e.z>1;if(!z&&!L){t.x*=m.x/2,t.y*=m.y/2,e.x*=m.x/2,e.y*=m.y/2,s.start.copy(t),s.start.z=0,s.end.copy(e),s.end.z=0;var E=s.closestPointToPointParameter(i,!0);s.at(E,a);var A=y.lerp(t.z,e.z,E),_=A>=-1&&A<=1,C=i.distanceTo(a)<.5*v;if(_&&C){s.start.fromBufferAttribute(g,w),s.end.fromBufferAttribute(x,w),s.start.applyMatrix4(b),s.end.applyMatrix4(b);var M=new u,B=new u;l.distanceSqToSegment(s.start,s.end,B,M),c.push({point:B,pointOnLine:M,distance:l.origin.distanceTo(B),object:this,face:null,faceIndex:w,uv:null,uv2:null})}}}}}()});class W{constructor(t){if(this.parser=new B,this.backgroundColor=14737632,this.travelColor=10027008,this.extrusionColor=65280,this.renderExtrusion=!0,this.renderTravel=!1,this.lineWidth=null,this.scene=new g,this.scene.background=new x(this.backgroundColor),this.canvas=t.canvas,this.targetId=t.targetId,this.limit=t.limit,this.topLayerColor=t.topLayerColor,this.lastSegmentColor=t.lastSegmentColor,this.lineWidth=t.lineWidth,console.debug("opts",t),this.canvas)this.renderer=new b({canvas:this.canvas,preserveDrawingBuffer:!0});else{const t=document.getElementById(this.targetId);if(!t)throw new Error("Unable to find element "+this.targetId);this.renderer=new b({preserveDrawingBuffer:!0}),this.canvas=this.renderer.domElement,t.appendChild(this.canvas)}this.camera=new w(75,this.canvas.offsetWidth/this.canvas.offsetHeight,10,1e3),this.camera.position.set(0,0,50),this.resize();new _(this.camera,this.renderer.domElement);this.animate()}get layers(){return this.parser.layers}animate(){requestAnimationFrame(()=>this.animate()),this.renderer.render(this.scene,this.camera)}processGCode(t){this.parser.parseGcode(t),this.render()}render(){for(;this.scene.children.length>0;)this.scene.remove(this.scene.children[0]);this.group=new S,this.group.name="gcode";const t={x:0,y:0,z:0,e:0};for(let e=0;e<this.layers.length&&!(e>this.limit);e++){const n={extrusion:[],travel:[],z:t.z},i=this.layers[e];for(const e of i.commands)if("g0"==e.gcode||"g1"==e.gcode){const i=e,r={x:void 0!==i.params.x?i.params.x:t.x,y:void 0!==i.params.y?i.params.y:t.y,z:void 0!==i.params.z?i.params.z:t.z,e:void 0!==i.params.e?i.params.e:t.e},s=i.params.e>0;(s&&this.renderExtrusion||!s&&this.renderTravel)&&this.addLineSegment(n,t,r,s),i.params.x&&(t.x=i.params.x),i.params.y&&(t.y=i.params.y),i.params.z&&(t.z=i.params.z),i.params.e&&(t.e=i.params.e)}if(this.renderExtrusion){const t=Math.round(80*e/this.layers.length),i=new x(`hsl(0, 0%, ${t}%)`).getHex();if(e==this.layers.length-1){const t=void 0!==this.topLayerColor?this.topLayerColor:i,e=void 0!==this.lastSegmentColor?this.lastSegmentColor:t,r=n.extrusion.splice(-3);this.addLine(n.extrusion,t);const s=n.extrusion.splice(-3);this.addLine([...s,...r],e)}else this.addLine(n.extrusion,i)}this.renderTravel&&this.addLine(n.travel,this.travelColor)}this.group.quaternion.setFromEuler(new z(-Math.PI/2,0,0)),this.group.position.set(-100,-20,100),this.scene.add(this.group),this.renderer.render(this.scene,this.camera)}clear(){this.limit=1/0,this.parser=new B}resize(){const[t,e]=[this.canvas.offsetWidth,this.canvas.offsetHeight];this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.renderer.setPixelRatio(window.devicePixelRatio),this.renderer.setSize(t,e,!1)}addLineSegment(t,e,n,i){(i?t.extrusion:t.travel).push(e.x,e.y,e.z,n.x,n.y,n.z)}addLine(t,e){if("number"==typeof this.lineWidth)return void this.addThickLine(t,e);const n=new L;n.setAttribute("position",new h(t,3));const i=new E({color:e}),r=new A(n,i);this.group.add(r)}addThickLine(t,e){const n=new G;n.setPositions(t);const i=new j({color:e,linewidth:this.lineWidth}),r=new I(n,i);this.group.add(r)}}export{W as WebGLPreview};
=======
import{UniformsLib as t,Vector2 as e,ShaderLib as n,UniformsUtils as i,ShaderMaterial as r,InstancedBufferGeometry as s,InstancedInterleavedBuffer as a,InterleavedBufferAttribute as o,WireframeGeometry as c,Box3 as l,Vector3 as u,Sphere as d,Float32BufferAttribute as h,Mesh as p,Vector4 as f,Matrix4 as m,Line3 as v,MathUtils as y,Scene as g,Color as x,WebGLRenderer as b,PerspectiveCamera as w,Group as S,Euler as z,BufferGeometry as L,LineBasicMaterial as E,LineSegments as A}from"three";import*as _ from"three-orbitcontrols";class C extends class{constructor(t,e){this.gcode=t,this.comment=e}}{constructor(t,e,n){super(t,n),this.params=e}}class M{constructor(t,e){this.layer=t,this.commands=e}}class B{constructor(){this.layers=[],this.curZ=0,this.maxZ=0}parseCommand(t,e=!0){const n=t.trim().split(";"),i=n[0],r=e&&n[1]||null,s=i.split(/ +/g),a=s[0].toLowerCase();switch(a){case"g0":case"g1":const t=this.parseMove(s.slice(1));return new C(a,t,r);default:return null}}parseMove(t){return t.reduce((t,e)=>{const n=e.charAt(0).toLowerCase();return"x"!=n&&"y"!=n&&"z"!=n&&"e"!=n||(t[n]=parseFloat(e.slice(1))),t},{})}groupIntoLayers(t){for(const e of t.filter(t=>t instanceof C)){const t=e.params;t.z&&(this.curZ=t.z),t.e>0&&this.curZ>this.maxZ?(this.maxZ=this.curZ,this.currentLayer=new M(this.layers.length,[e]),this.layers.push(this.currentLayer)):this.currentLayer&&this.currentLayer.commands.push(e)}return this.layers}parseGcode(t){const e=Array.isArray(t)?t:t.split("\n").filter(t=>t.length>0),n=this.lines2commands(e);return this.groupIntoLayers(n),{layers:this.layers}}lines2commands(t){return t.filter(t=>t.length>0).map(t=>this.parseCommand(t)).filter(t=>null!==t)}}t.line={linewidth:{value:1},resolution:{value:new e(1,1)},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},n.line={uniforms:i.merge([t.common,t.fog,t.line]),vertexShader:"\n\t\t#include <common>\n\t\t#include <color_pars_vertex>\n\t\t#include <fog_pars_vertex>\n\t\t#include <logdepthbuf_pars_vertex>\n\t\t#include <clipping_planes_pars_vertex>\n\n\t\tuniform float linewidth;\n\t\tuniform vec2 resolution;\n\n\t\tattribute vec3 instanceStart;\n\t\tattribute vec3 instanceEnd;\n\n\t\tattribute vec3 instanceColorStart;\n\t\tattribute vec3 instanceColorEnd;\n\n\t\tvarying vec2 vUv;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashScale;\n\t\t\tattribute float instanceDistanceStart;\n\t\t\tattribute float instanceDistanceEnd;\n\t\t\tvarying float vLineDistance;\n\n\t\t#endif\n\n\t\tvoid trimSegment( const in vec4 start, inout vec4 end ) {\n\n\t\t\t// trim end segment so it terminates between the camera plane and the near plane\n\n\t\t\t// conservative estimate of the near plane\n\t\t\tfloat a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column\n\t\t\tfloat b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column\n\t\t\tfloat nearEstimate = - 0.5 * b / a;\n\n\t\t\tfloat alpha = ( nearEstimate - start.z ) / ( end.z - start.z );\n\n\t\t\tend.xyz = mix( start.xyz, end.xyz, alpha );\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\t#ifdef USE_COLOR\n\n\t\t\t\tvColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;\n\n\t\t\t#endif\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;\n\n\t\t\t#endif\n\n\t\t\tfloat aspect = resolution.x / resolution.y;\n\n\t\t\tvUv = uv;\n\n\t\t\t// camera space\n\t\t\tvec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );\n\t\t\tvec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\n\t\t\t// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n\t\t\t// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space\n\t\t\t// but we need to perform ndc-space calculations in the shader, so we must address this issue directly\n\t\t\t// perhaps there is a more elegant solution -- WestLangley\n\n\t\t\tbool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column\n\n\t\t\tif ( perspective ) {\n\n\t\t\t\tif ( start.z < 0.0 && end.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( start, end );\n\n\t\t\t\t} else if ( end.z < 0.0 && start.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( end, start );\n\n\t\t\t\t}\n\n\t\t\t}\n\n\t\t\t// clip space\n\t\t\tvec4 clipStart = projectionMatrix * start;\n\t\t\tvec4 clipEnd = projectionMatrix * end;\n\n\t\t\t// ndc space\n\t\t\tvec2 ndcStart = clipStart.xy / clipStart.w;\n\t\t\tvec2 ndcEnd = clipEnd.xy / clipEnd.w;\n\n\t\t\t// direction\n\t\t\tvec2 dir = ndcEnd - ndcStart;\n\n\t\t\t// account for clip-space aspect ratio\n\t\t\tdir.x *= aspect;\n\t\t\tdir = normalize( dir );\n\n\t\t\t// perpendicular to dir\n\t\t\tvec2 offset = vec2( dir.y, - dir.x );\n\n\t\t\t// undo aspect ratio adjustment\n\t\t\tdir.x /= aspect;\n\t\t\toffset.x /= aspect;\n\n\t\t\t// sign flip\n\t\t\tif ( position.x < 0.0 ) offset *= - 1.0;\n\n\t\t\t// endcaps\n\t\t\tif ( position.y < 0.0 ) {\n\n\t\t\t\toffset += - dir;\n\n\t\t\t} else if ( position.y > 1.0 ) {\n\n\t\t\t\toffset += dir;\n\n\t\t\t}\n\n\t\t\t// adjust for linewidth\n\t\t\toffset *= linewidth;\n\n\t\t\t// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n\t\t\toffset /= resolution.y;\n\n\t\t\t// select end\n\t\t\tvec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;\n\n\t\t\t// back to clip space\n\t\t\toffset *= clip.w;\n\n\t\t\tclip.xy += offset;\n\n\t\t\tgl_Position = clip;\n\n\t\t\tvec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation\n\n\t\t\t#include <logdepthbuf_vertex>\n\t\t\t#include <clipping_planes_vertex>\n\t\t\t#include <fog_vertex>\n\n\t\t}\n\t\t",fragmentShader:"\n\t\tuniform vec3 diffuse;\n\t\tuniform float opacity;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashSize;\n\t\t\tuniform float gapSize;\n\n\t\t#endif\n\n\t\tvarying float vLineDistance;\n\n\t\t#include <common>\n\t\t#include <color_pars_fragment>\n\t\t#include <fog_pars_fragment>\n\t\t#include <logdepthbuf_pars_fragment>\n\t\t#include <clipping_planes_pars_fragment>\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\t#include <clipping_planes_fragment>\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tif ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps\n\n\t\t\t\tif ( mod( vLineDistance, dashSize + gapSize ) > dashSize ) discard; // todo - FIX\n\n\t\t\t#endif\n\n\t\t\tif ( abs( vUv.y ) > 1.0 ) {\n\n\t\t\t\tfloat a = vUv.x;\n\t\t\t\tfloat b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;\n\t\t\t\tfloat len2 = a * a + b * b;\n\n\t\t\t\tif ( len2 > 1.0 ) discard;\n\n\t\t\t}\n\n\t\t\tvec4 diffuseColor = vec4( diffuse, opacity );\n\n\t\t\t#include <logdepthbuf_fragment>\n\t\t\t#include <color_fragment>\n\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );\n\n\t\t\t#include <tonemapping_fragment>\n\t\t\t#include <encodings_fragment>\n\t\t\t#include <fog_fragment>\n\t\t\t#include <premultiplied_alpha_fragment>\n\n\t\t}\n\t\t"};var P=function(t){r.call(this,{type:"LineMaterial",uniforms:i.clone(n.line.uniforms),vertexShader:n.line.vertexShader,fragmentShader:n.line.fragmentShader,clipping:!0}),this.dashed=!1,Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}}}),this.setValues(t)};(P.prototype=Object.create(r.prototype)).constructor=P,P.prototype.isLineMaterial=!0;var j,U,G=function(){s.call(this),this.type="LineSegmentsGeometry";this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new h([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new h([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))};G.prototype=Object.assign(Object.create(s.prototype),{constructor:G,isLineSegmentsGeometry:!0,applyMatrix4:function(t){var e=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==e&&(e.applyMatrix4(t),n.applyMatrix4(t),e.data.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this},setPositions:function(t){var e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));var n=new a(e,6,1);return this.setAttribute("instanceStart",new o(n,3,0)),this.setAttribute("instanceEnd",new o(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this},setColors:function(t){var e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));var n=new a(e,6,1);return this.setAttribute("instanceColorStart",new o(n,3,0)),this.setAttribute("instanceColorEnd",new o(n,3,3)),this},fromWireframeGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromEdgesGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromMesh:function(t){return this.fromWireframeGeometry(new c(t.geometry)),this},fromLineSegements:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},computeBoundingBox:(U=new l,function(){null===this.boundingBox&&(this.boundingBox=new l);var t=this.attributes.instanceStart,e=this.attributes.instanceEnd;void 0!==t&&void 0!==e&&(this.boundingBox.setFromBufferAttribute(t),U.setFromBufferAttribute(e),this.boundingBox.union(U))}),computeBoundingSphere:(j=new u,function(){null===this.boundingSphere&&(this.boundingSphere=new d),null===this.boundingBox&&this.computeBoundingBox();var t=this.attributes.instanceStart,e=this.attributes.instanceEnd;if(void 0!==t&&void 0!==e){var n=this.boundingSphere.center;this.boundingBox.getCenter(n);for(var i=0,r=0,s=t.count;r<s;r++)j.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(j)),j.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(j));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}),toJSON:function(){},applyMatrix:function(t){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(t)}});var D=function(){G.call(this),this.type="LineGeometry"};D.prototype=Object.assign(Object.create(G.prototype),{constructor:D,isLineGeometry:!0,setPositions:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return G.prototype.setPositions.call(this,n),this},setColors:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return G.prototype.setColors.call(this,n),this},fromLine:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},copy:function(){return this}});var T,F,I=function(t,e){p.call(this),this.type="LineSegments2",this.geometry=void 0!==t?t:new G,this.material=void 0!==e?e:new P({color:16777215*Math.random()})};I.prototype=Object.assign(Object.create(p.prototype),{constructor:I,isLineSegments2:!0,computeLineDistances:(T=new u,F=new u,function(){for(var t=this.geometry,e=t.attributes.instanceStart,n=t.attributes.instanceEnd,i=new Float32Array(2*e.data.count),r=0,s=0,c=e.data.count;r<c;r++,s+=2)T.fromBufferAttribute(e,r),F.fromBufferAttribute(n,r),i[s]=0===s?0:i[s-1],i[s+1]=i[s]+T.distanceTo(F);var l=new a(i,2,1);return t.setAttribute("instanceDistanceStart",new o(l,1,0)),t.setAttribute("instanceDistanceEnd",new o(l,1,1)),this}),raycast:function(){var t=new f,e=new f,n=new f,i=new u,r=new m,s=new v,a=new u;return function(o,c){null===o.camera&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2.');var l=o.ray,d=o.camera,h=d.projectionMatrix,p=this.geometry,f=this.material,m=f.resolution,v=f.linewidth,g=p.attributes.instanceStart,x=p.attributes.instanceEnd;l.at(1,n),n.w=1,n.applyMatrix4(d.matrixWorldInverse),n.applyMatrix4(h),n.multiplyScalar(1/n.w),n.x*=m.x/2,n.y*=m.y/2,n.z=0,i.copy(n);var b=this.matrixWorld;r.multiplyMatrices(d.matrixWorldInverse,b);for(var w=0,S=g.count;w<S;w++){t.fromBufferAttribute(g,w),e.fromBufferAttribute(x,w),t.w=1,e.w=1,t.applyMatrix4(r),e.applyMatrix4(r),t.applyMatrix4(h),e.applyMatrix4(h),t.multiplyScalar(1/t.w),e.multiplyScalar(1/e.w);var z=t.z<-1&&e.z<-1,L=t.z>1&&e.z>1;if(!z&&!L){t.x*=m.x/2,t.y*=m.y/2,e.x*=m.x/2,e.y*=m.y/2,s.start.copy(t),s.start.z=0,s.end.copy(e),s.end.z=0;var E=s.closestPointToPointParameter(i,!0);s.at(E,a);var A=y.lerp(t.z,e.z,E),_=A>=-1&&A<=1,C=i.distanceTo(a)<.5*v;if(_&&C){s.start.fromBufferAttribute(g,w),s.end.fromBufferAttribute(x,w),s.start.applyMatrix4(b),s.end.applyMatrix4(b);var M=new u,B=new u;l.distanceSqToSegment(s.start,s.end,B,M),c.push({point:B,pointOnLine:M,distance:l.origin.distanceTo(B),object:this,face:null,faceIndex:w,uv:null,uv2:null})}}}}}()});class W{constructor(t){if(this.parser=new B,this.backgroundColor=14737632,this.travelColor=10027008,this.extrusionColor=65280,this.renderExtrusion=!0,this.renderTravel=!1,this.lineWidth=null,this.scene=new g,this.scene.background=new x(this.backgroundColor),this.canvas=t.canvas,this.targetId=t.targetId,this.limit=t.limit,this.topLayerColor=t.topLayerColor,this.lastSegmentColor=t.lastSegmentColor,this.lineWidth=t.lineWidth,console.debug("opts",t),this.canvas)this.renderer=new b({canvas:this.canvas});else{const t=document.getElementById(this.targetId);if(!t)throw new Error("Unable to find element "+this.targetId);this.renderer=new b,this.canvas=this.renderer.domElement,t.appendChild(this.canvas)}this.renderer.setPixelRatio(window.devicePixelRatio),this.camera=new w(75,this.canvas.offsetWidth/this.canvas.offsetHeight,10,1e3),this.camera.position.set(0,0,50),this.resize();new _(this.camera,this.renderer.domElement);this.animate()}get layers(){return this.parser.layers}animate(){requestAnimationFrame(()=>this.animate()),this.renderer.render(this.scene,this.camera)}processGCode(t){this.parser.parseGcode(t),this.render()}render(){for(;this.scene.children.length>0;)this.scene.remove(this.scene.children[0]);this.group=new S,this.group.name="gcode";const t={x:0,y:0,z:0,e:0};for(let e=0;e<this.layers.length&&!(e>this.limit);e++){const n={extrusion:[],travel:[],z:t.z},i=this.layers[e];for(const e of i.commands)if("g0"==e.gcode||"g1"==e.gcode){const i=e,r={x:void 0!==i.params.x?i.params.x:t.x,y:void 0!==i.params.y?i.params.y:t.y,z:void 0!==i.params.z?i.params.z:t.z,e:void 0!==i.params.e?i.params.e:t.e},s=i.params.e>0;(s&&this.renderExtrusion||!s&&this.renderTravel)&&this.addLineSegment(n,t,r,s),i.params.x&&(t.x=i.params.x),i.params.y&&(t.y=i.params.y),i.params.z&&(t.z=i.params.z),i.params.e&&(t.e=i.params.e)}if(this.renderExtrusion){const t=Math.round(80*e/this.layers.length),i=new x(`hsl(0, 0%, ${t}%)`).getHex();if(e==this.layers.length-1){const t=void 0!==this.topLayerColor?this.topLayerColor:i,e=void 0!==this.lastSegmentColor?this.lastSegmentColor:t,r=n.extrusion.splice(-3);this.addLine(n.extrusion,t);const s=n.extrusion.splice(-3);this.addLine([...s,...r],e)}else this.addLine(n.extrusion,i)}this.renderTravel&&this.addLine(n.travel,this.travelColor)}this.group.quaternion.setFromEuler(new z(-Math.PI/2,0,0)),this.group.position.set(-100,-20,100),this.scene.add(this.group),this.renderer.render(this.scene,this.camera)}clear(){this.limit=1/0,this.parser=new B}resize(){const[t,e]=[this.canvas.offsetWidth,this.canvas.offsetHeight];this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.renderer.setPixelRatio(window.devicePixelRatio),this.renderer.setSize(t,e,!1)}addLineSegment(t,e,n,i){(i?t.extrusion:t.travel).push(e.x,e.y,e.z,n.x,n.y,n.z)}addLine(t,e){if("number"==typeof this.lineWidth)return void this.addThickLine(t,e);const n=new L;n.setAttribute("position",new h(t,3));const i=new E({color:e}),r=new A(n,i);this.group.add(r)}addThickLine(t,e){const n=new D;n.setPositions(t);const i=new P({color:e,linewidth:this.lineWidth}),r=new I(n,i);this.group.add(r)}}export{W as WebGLPreview};
>>>>>>> d9ca2ca... Include updated builds
