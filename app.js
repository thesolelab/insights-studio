'use strict';
const $ = id => document.getElementById(id);
const SVGNS='http://www.w3.org/2000/svg';
let latestResult=null;
// Chart-only overrides; interface colors and statistical inputs stay independent.
const abAppearance = {};
function erf(x){
  const s=x<0?-1:1;
  x=Math.abs(x);
  const t=1/(1+0.3275911*x);
  return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x));
}
function normalCDF(z){
  return 0.5*(1+erf(z/Math.SQRT2));
}
function fmtPct(n,d=2){
  return (100*n).toFixed(d)+'%';
}
function fmtP(n){
  return n<0.0001?'<0.0001':n.toFixed(4);
}
function node(name,attrs={
},text){
  const el=document.createElementNS(SVGNS,name);
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
  if(text!==undefined)el.textContent=text;
  return el;
}
function calculate(a,ca,b,cb,hyp){
  const pa=ca/a,pb=cb/b,d=pb-pa,pooled=(ca+cb)/(a+b),seA=Math.sqrt(pa*(1-pa)/a),seB=Math.sqrt(pb*(1-pb)/b),seDiff=Math.sqrt(seA*seA+seB*seB),sePooled=Math.sqrt(pooled*(1-pooled)*(1/a+1/b));
  const z=sePooled===0?(d===0?0:(d>0?Infinity:-Infinity)):d/sePooled;
  const p=hyp==='greater'?1-normalCDF(z):2*(1-normalCDF(Math.abs(z)));
  const critical=hyp==='greater'?1.6448536269514722:1.959963984540054;
  const ciLow=d-critical*seDiff,ciHigh=hyp==='greater'?Infinity:d+critical*seDiff;
  return{
    a,ca,b,cb,pa,pb,d,seA,seB,seDiff,sePooled,z,p:Math.max(0,Math.min(1,p)),hyp,critical,ciLow,ciHigh,significant:p<.05
  };
}
function drawChart(r){
  const svg=$('distribution');
  // Resolve design tokens into literal attributes for standalone SVG/PNG exports.
  const tokens=getComputedStyle(document.documentElement);
  const color=name=>tokens.getPropertyValue(name).trim();
  const text=abAppearance.text || color('--text');
  const axis=abAppearance.axis || color('--text-muted');
  const font=tokens.getPropertyValue('--font-body').trim();
  const chart=document.createDocumentFragment();
  chart.appendChild(node('rect',{
    'data-chart-background':'true',width:1100,height:510,fill:abAppearance.background || color('--surface-inset')
  }));
  const left=82,right=1060,top=38,bottom=430;
  const sigmaA=Math.max(r.seA,1e-8),sigmaB=Math.max(r.seB,1e-8);
  let min=Math.min(r.pa-3.8*sigmaA,r.pb-3.8*sigmaB),max=Math.max(r.pa+3.8*sigmaA,r.pb+3.8*sigmaB);
  if(max-min<1e-8){
    min-=.001;
    max+=.001;
  }
  const x=v=>left+(v-min)/(max-min)*(right-left);
  const pdf=(v,mu,s)=>Math.exp(-.5*((v-mu)/s)**2)/s;
  const peak=Math.max(pdf(r.pa,r.pa,sigmaA),pdf(r.pb,r.pb,sigmaB));
  const y=v=>bottom-v/peak*310;
  for(let i=0;i<=4;i++){
    const yy=bottom-i*75;
    chart.appendChild(node('line',{
      x1:left,x2:right,y1:yy,y2:yy,stroke:axis,'stroke-opacity':'.08'
    }));
  }
  chart.appendChild(node('line',{
    x1:left,x2:right,y1:bottom,y2:bottom,stroke:axis,'stroke-opacity':'.2'
  }));
  const series=[{
    mu:r.pa,s:sigmaA,color:color('--chart-control'),label:'CR A: '+fmtPct(r.pa)
  },{
    mu:r.pb,s:sigmaB,color:color('--chart-variant'),label:'CR B: '+fmtPct(r.pb)
  }
  ];
  series.forEach((ser,index)=>{
    let d='';for(let i=0;i<=420;i++){
      const v=min+(max-min)*i/420,xx=x(v),yy=y(pdf(v,ser.mu,ser.s));d+=(i?' L':'M')+xx.toFixed(2)+' '+yy.toFixed(2);
    }
    chart.appendChild(node('path',{
      d:d+` L ${x(max)} ${bottom} L ${x(min)} ${bottom} Z`,fill:ser.color,'fill-opacity':index===0?'.08':'.15'
    }));chart.appendChild(node('path',{
      d,fill:'none',stroke:ser.color,'stroke-width':3
    }));const meanX=x(ser.mu);chart.appendChild(node('line',{
      x1:meanX,x2:meanX,y1:top,y2:bottom,stroke:text,'stroke-opacity':'.35','stroke-dasharray':'5 6'
    }));chart.appendChild(node('text',{
      x:meanX+12,y:250,transform:`rotate(-90 ${meanX+12} 250)`,fill:text,'font-size':19,'font-family':font,'font-weight':700,'style':'font-variant-numeric:tabular-nums'
    },ser.label));const boundary=ser.mu+(index===0?-1:1)*r.critical*ser.s;const bx=x(boundary);if(bx>=left&&bx<=right){
      chart.appendChild(node('line',{
        x1:bx,x2:bx,y1:top,y2:bottom,stroke:text,'stroke-opacity':'.25','stroke-dasharray':'3 6'
      }));chart.appendChild(node('text',{
        x:bx+12,y:245,transform:`rotate(-90 ${bx+12} 245)`,fill:text,'font-size':18,'font-family':font,'font-weight':700,'style':'font-variant-numeric:tabular-nums'
      },'95%'));
    }
  });
  for(let i=0;i<=5;i++){
    const v=min+(max-min)*i/5;
    chart.appendChild(node('text',{
      x:x(v),y:461,fill:axis,'font-size':15,'font-family':font,'font-weight':700,'style':'font-variant-numeric:tabular-nums','text-anchor':'middle'
    },fmtPct(v,2)));
  }
  chart.appendChild(node('text',{
    x:570,y:495,fill:axis,'font-size':18,'font-family':font,'font-weight':700,'style':'font-variant-numeric:tabular-nums','text-anchor':'middle'
  },'Conversion rate'));
  chart.appendChild(node('title',{
  },'Conversion rate distributions for Control A and Variant B'));
  svg.replaceChildren(chart);
}
function stat(label,value){
  const div=document.createElement('div');
  div.className='stat';
  const s=document.createElement('small');
  s.textContent=label;
  const v=document.createElement('strong');
  v.textContent=value;
  div.append(s,v);
  return div;
}
function render(r){
  latestResult=r;
  $('method-label').textContent='95% confidence · '+(r.hyp==='greater'?'One-sided (B > A)':'Two-sided (B ≠ A)');
  $('verdict-pill').textContent=r.significant?'Significant':'Not significant';
  $('verdict-pill').className='pill'+(r.significant?' significant':'');
  const headline=r.significant?(r.d>0?'Variant B outperformed Control A':'Statistically significant difference detected'):'Statistical significance not established';
  $('verdict').replaceChildren();
  const strong=document.createElement('strong');
  strong.textContent=headline;
  const paragraph=document.createElement('p');
  const lift=r.pa===0?'undefined relative lift':(r.d>=0?'+':'')+fmtPct(r.d/r.pa);
  paragraph.textContent=`Variant B converted at ${fmtPct(r.pb)} versus ${fmtPct(r.pa)} for Control A (${lift}). ${r.significant?'The selected test meets':'The selected test does not meet'} the 95% significance threshold (p = ${fmtP(r.p)}).`;
  $('verdict').append(strong,paragraph);
  $('rate-a').textContent=fmtPct(r.pa);
  $('rate-b').textContent=fmtPct(r.pb);
  $('lift').textContent=r.pa===0?'N/A':(r.d>=0?'+':'')+fmtPct(r.d/r.pa);
  $('p-value').textContent=fmtP(r.p);
  const stats=[['Visitors A',r.a.toLocaleString()],['Conversions A',r.ca.toLocaleString()],['Visitors B',r.b.toLocaleString()],['Conversions B',r.cb.toLocaleString()],['Conversion rate A',fmtPct(r.pa)],['Conversion rate B',fmtPct(r.pb)],['Absolute difference',(r.d>=0?'+':'')+(r.d*100).toFixed(3)+' pp'],['Relative lift',r.pa===0?'N/A':(r.d>=0?'+':'')+fmtPct(r.d/r.pa)],['Hypothesis',r.hyp==='greater'?'One-sided (B > A)':'Two-sided (B ≠ A)'],['Confidence level','95%'],['P-value',fmtP(r.p)],['Z-score',Number.isFinite(r.z)?r.z.toFixed(4):String(r.z)],['Standard error A',r.seA.toFixed(6)],['Standard error B',r.seB.toFixed(6)],['SE of difference (unpooled)',r.seDiff.toFixed(6)],['SE of difference (pooled)',r.sePooled.toFixed(6)],['Critical Z',r.critical.toFixed(4)],['95% CI lower (absolute lift)',(r.ciLow*100).toFixed(3)+' pp'],['95% CI upper (absolute lift)',Number.isFinite(r.ciHigh)?(r.ciHigh*100).toFixed(3)+' pp':'∞ (one-sided)']];
  $('stat-grid').replaceChildren(...stats.map(([l,v])=>stat(l,v)));
  drawChart(r);
}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;
  a.download=name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function svgText(transparent=false){
  const copy=$('distribution').cloneNode(true);
  if(transparent)copy.querySelector('[data-chart-background]')?.remove();
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
  copy.setAttribute('width','2200');
  copy.setAttribute('height','1020');
  return new XMLSerializer().serializeToString(copy);
}
$('export-svg').addEventListener('click',()=>download(new Blob([svgText()],{
  type:'image/svg+xml;charset=utf-8'
}),'queue-works-ab-distribution.svg'));
$('export-png').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([svgText($('ab-png-background').value === 'transparent')],{
    type:'image/svg+xml;charset=utf-8'
  })),img=new Image();img.onload=()=>{
    const c=document.createElement('canvas');c.width=2200;c.height=1020;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(blob=>{
      if(blob)download(blob,'queue-works-ab-distribution.png');else alert('Unable to export PNG. Try SVG instead.');
    },'image/png');
  };img.onerror=()=>{
    URL.revokeObjectURL(url);alert('Unable to export PNG. Try SVG instead.');
  };img.src=url;
});
$('test-form').addEventListener('submit',e=>{
  e.preventDefault();const vals=['visitors-a','conversions-a','visitors-b','conversions-b'].map(id=>Number($(id).value));const [a,ca,b,cb]=vals;if(vals.some((v,i)=>!Number.isSafeInteger(v)||v<0||$( ['visitors-a','conversions-a','visitors-b','conversions-b'][i]).value.trim()==='')||a<=0||b<=0||ca>a||cb>b){
    $('error').textContent='Enter valid whole numbers; conversions cannot exceed visitors.';return;
  }
  const pa=ca/a,pb=cb/b;if(pa===0||pa===1||pb===0||pb===1){
    $('error').textContent='For this normal-approximation calculator, both conversion rates must be between 0% and 100%.';return;
  }
  if(Math.min(ca,a-ca,cb,b-cb)<5){
    $('error').textContent='At least 5 conversions and 5 non-conversions per group are required for this approximation.';return;
  }
  $('error').textContent='';render(calculate(a,ca,b,cb,document.querySelector('input[name=hypothesis]:checked').value));
});
// Demo counts vary on every load; each group satisfies the approximation limits.
function generateSampleData(random=Math.random){
  const integer=(min,max)=>min+Math.floor(random()*(max-min+1));
  const visitorsA=integer(10000,100000);
  const visitorsB=integer(10000,100000);
  const rateA=0.01+random()*0.11;
  const rateB=rateA*(0.8+random()*0.4);
  return {
    visitorsA,
    visitorsB,
    conversionsA:Math.round(visitorsA*rateA),
    conversionsB:Math.round(visitorsB*rateB)
  };
}

const sample=generateSampleData();
for(const [id,value] of Object.entries({
  'visitors-a':sample.visitorsA,
  'visitors-b':sample.visitorsB,
  'conversions-a':sample.conversionsA,
  'conversions-b':sample.conversionsB
})){
  $(id).value=value;
}
$('test-form').requestSubmit();

if(typeof window!=='undefined' && window.ChartColors){
  for(const [name,variable] of [['Control A','--chart-control'],['Variant B','--chart-variant']]){
    const initial=getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    const picker=window.ChartColors.control(name,initial,color=>{
      document.documentElement.style.setProperty(variable,color);
      if(latestResult)drawChart(latestResult);
    });
    $('ab-colors').appendChild(picker.element);
  }
  for(const [name,key,variable] of [
    ['Background','background','--surface-inset'],
    ['Axis labels & title','axis','--text-muted'],
    ['Chart text','text','--text']
  ]){
    const initial=getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    const picker=window.ChartColors.control(name,initial,color=>{
      abAppearance[key]=color;
      if(latestResult)drawChart(latestResult);
    });
    $('ab-colors').appendChild(picker.element);
  }
}
