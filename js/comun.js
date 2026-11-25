// Datos y utilidades compartidas por todas las páginas de SemáforoVivo Lima.
// Las cifras son de demostración (simuladas), no mediciones reales.
const INTERSECCIONES=[
  {id:'abancay', nombre:'Av. Abancay con Av. Nicolás de Piérola', distrito:'Cercado de Lima',
   lat:-12.0549, lng:-77.0292,
   flujo:{aa:14,am:8,ac:5,ba:9,bm:5,bc:3,pn:14,ps:3},
   base:{espera:52.4,cola:38,peatones:18.5}},
  {id:'arequipa', nombre:'Av. Javier Prado con Av. Arequipa', distrito:'San Isidro / Lince',
   lat:-12.0906, lng:-77.0345,
   flujo:{aa:18,am:10,ac:4,ba:12,bm:6,bc:4,pn:8,ps:2},
   base:{espera:61.8,cola:45,peatones:21.0}},
  {id:'universitaria', nombre:'Av. Universitaria con Av. Venezuela', distrito:'Lima / San Miguel',
   lat:-12.0590, lng:-77.0832,
   flujo:{aa:8,am:6,ac:3,ba:6,bm:4,bc:2,pn:10,ps:2},
   base:{espera:33.5,cola:22,peatones:12.0}}
];
const TIPOS_INCIDENCIA=['Vehículo detenido','Obstáculo en la vía','Semáforo averiado','Accidente','Obra en la vía','Cruce peatonal inseguro'];
const ESTADOS={abierta:'Abierta',proceso:'En proceso',resuelta:'Resuelta'};

const leer=(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } };
const guardar=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const simulaciones=()=>leer('sv_simulaciones',[]);
const incidencias=()=>leer('sv_incidencias',null) ?? incidenciasEjemplo();
const porId=id=>INTERSECCIONES.find(i=>i.id===id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fecha=t=>new Date(t).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'});

function incidenciasEjemplo(){
  const h=Date.now();
  const l=[
    {id:1,inter:'abancay',tipo:'Vehículo detenido',desc:'Combi malograda en el carril derecho',resp:'Inspector J. Quispe',prio:'alta',estado:'abierta',creada:h-3600e3},
    {id:2,inter:'arequipa',tipo:'Obra en la vía',desc:'Trabajos de Sedapal reducen un carril',resp:'Área de Obras',prio:'media',estado:'proceso',creada:h-86400e3},
    {id:3,inter:'universitaria',tipo:'Cruce peatonal inseguro',desc:'Cebra borrada frente a la universidad',resp:'Señalización',prio:'media',estado:'resuelta',creada:h-3*86400e3}
  ];
  guardar('sv_incidencias',l);
  return l;
}

// Último resultado guardado del simulador para una intersección (o null).
function ultimaSimulacion(id){
  return simulaciones().filter(s=>s.inter===id).sort((a,b)=>b.fecha-a.fecha)[0]||null;
}
// Indicadores actuales: usa la última comparación guardada; si no hay, los datos base de demostración.
function indicadores(i){
  const s=ultimaSimulacion(i.id);
  if(s) return {espera:s.int.espera, cola:s.int.cola, peatones:s.int.peatones, fuente:'simulación '+fecha(s.fecha), sim:s};
  return {...i.base, fuente:'datos de demostración', sim:null};
}
function nivel(espera){
  return espera>=50?{clase:'n-alto',texto:'Alta'} : espera>=30?{clase:'n-medio',texto:'Media'} : {clase:'n-bajo',texto:'Baja'};
}
function alertas(){
  const a=[];
  INTERSECCIONES.forEach(i=>{
    const k=indicadores(i);
    if(k.espera>=50) a.push({grado:'alta',texto:`Congestión alta en ${i.nombre}: espera promedio de ${k.espera.toFixed(1)} s.`,ir:'mapa.html?i='+i.id});
    else if(k.espera>=30) a.push({grado:'media',texto:`Congestión media en ${i.nombre}: espera de ${k.espera.toFixed(1)} s.`,ir:'mapa.html?i='+i.id});
    if(k.peatones>=20) a.push({grado:'media',texto:`Peatones esperan ${k.peatones.toFixed(1)} s en ${i.nombre}. Revisar cruce inclusivo.`,ir:'mapa.html?i='+i.id});
    if(!k.sim) a.push({grado:'info',texto:`${i.nombre} aún no tiene una comparación guardada en el simulador.`,ir:'simulador.html?i='+i.id});
  });
  incidencias().filter(x=>x.estado!=='resuelta').forEach(x=>{
    a.push({grado:x.prio==='alta'?'alta':'media',texto:`Incidencia ${ESTADOS[x.estado].toLowerCase()}: ${x.tipo} en ${porId(x.inter)?.nombre||x.inter} (${x.resp||'sin responsable'}).`,ir:'incidencias.html'});
  });
  const orden={alta:0,media:1,info:2};
  return a.sort((x,y)=>orden[x.grado]-orden[y.grado]);
}

function menu(aqui){
  const paginas=[['index.html','Dashboard'],['mapa.html','Mapa'],['simulador.html','Simulador'],['incidencias.html','Incidencias'],['reportes.html','Reportes']];
  const h=document.createElement('header');
  h.className='barra';
  h.innerHTML=`<a class="marca" href="index.html">SemáforoVivo Lima<small>Plataforma municipal de movilidad · Smart Mobility</small></a>
    <nav>${paginas.map(([u,t])=>`<a href="${u}" class="${u===aqui?'aqui':''}">${t}</a>`).join('')}</nav>`;
  document.body.prepend(h);
}
