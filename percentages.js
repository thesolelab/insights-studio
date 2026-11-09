(function (root) {
  'use strict';
  function number(value) {
    const text = String(value).trim();
    if (!text || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error('Enter a valid number in both fields.');
    const result = Number(text);
    if (!Number.isFinite(result)) throw new Error('Use finite numbers.');
    return result;
  }
  function calculate(mode, first, second) {
    const a = number(first), b = number(second);
    let value;
    if (mode === 'of') value = (a / 100) * b;
    else if (mode === 'portion') {
      if (b === 0) throw new Error('The total cannot be zero.');
      value = (a / b) * 100;
    } else if (mode === 'change') {
      if (a === 0) throw new Error('Percentage change is undefined when the starting value is zero.');
      if (a < 0) throw new Error('Use a positive starting value for percentage increase/decrease.');
      value = ((b - a) / a) * 100;
    } else throw new Error('Choose a supported calculation.');
    if (!Number.isFinite(value)) throw new Error('These numbers produce a result outside the supported range.');
    return Object.is(value, -0) ? 0 : value;
  }
  function format(value) {
    // Shift via exponent strings so decimal ties such as 36.25 round predictably.
    const [mantissa, exponent = '0'] = Math.abs(value).toString().split('e');
    const shifted = Number(mantissa + 'e' + (Number(exponent) + 1));
    const rounded = Number.isFinite(shifted) ? Math.round(shifted) / 10 : Math.abs(value);
    return (value < 0 && rounded !== 0 ? -rounded : rounded).toFixed(1);
  }
  function mount(container) {
    function el(tag, text, attrs = {}) {
      const node = document.createElement(tag);
      if (text !== null) node.textContent = text;
      for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
      return node;
    }
    const intro = el('div', null, {class:'percentage-intro'});
    intro.append(el('h2','Percentage calculator'),el('p','Quick answers for percentages, proportions, and increases or decreases. No project or saved data required.',{class:'note'}));
    container.append(intro);
    const specs = [
      {id:'of', title:'Percentage of a number', before:'What is', between:'% of', after:'?', first:'Percentage', second:'Number', example:'Example: 15% of 200 = 30', formula:'Result = percentage ÷ 100 × number'},
      {id:'portion', title:'One number as a percentage of another', before:'', between:'is what percent of', after:'?', first:'Part', second:'Total', example:'Example: 30 is 15% of 200', formula:'Result = part ÷ total × 100'},
      {id:'change', title:'Percentage increase or decrease', before:'From', between:'to', after:'', first:'Starting value', second:'Ending value', example:'Example: 200 to 250 = 25% increase', formula:'Result = (ending − starting) ÷ starting × 100. Starting value must be positive.'}
    ];
    for (const spec of specs) {
      const card = el('section',null,{class:'panel percentage-card','aria-labelledby':'percentage-'+spec.id+'-title'});
      card.append(el('h3',spec.title,{id:'percentage-'+spec.id+'-title'}));
      const form = el('form',null,{class:'percentage-form',novalidate:''}), sentence=el('div',null,{class:'percentage-sentence'});
      function input(label, suffix) {
        const wrap=el('label',null,{class:'percentage-input'}), node=el('input',null,{type:'text',inputmode:'decimal',id:'percentage-'+spec.id+'-'+suffix,autocomplete:'off','aria-describedby':'percentage-'+spec.id+'-help'});
        wrap.append(el('span',label,{class:'percentage-label'}),node); return {wrap,node};
      }
      const a=input(spec.first,'first'),b=input(spec.second,'second');
      if(spec.before)sentence.append(el('span',spec.before));
      sentence.append(a.wrap,el('span',spec.between),b.wrap);
      if(spec.after)sentence.append(el('span',spec.after));
      const actions=el('div',null,{class:'percentage-actions'}),calculateButton=el('button','Calculate',{type:'submit',class:'primary'});
      const result=el('output','—',{class:'percentage-result',id:'percentage-'+spec.id+'-result','aria-label':spec.title+' result','aria-live':'polite'});
      result.setAttribute('for',a.node.id+' '+b.node.id);
      const copy=el('button','Copy',{type:'button',class:'percentage-copy','aria-label':'Copy '+spec.title.toLowerCase()+' result',disabled:''});
      const status=el('p','',{class:'percentage-feedback',id:'percentage-'+spec.id+'-feedback',role:'status'});
      const help=el('p',spec.example+' · '+spec.formula,{class:'note',id:'percentage-'+spec.id+'-help'});
      a.node.setAttribute('aria-describedby',help.id+' '+status.id);b.node.setAttribute('aria-describedby',help.id+' '+status.id);
      let copyValue=null, generation=0;
      function invalidate() {
        generation++;copyValue=null;copy.disabled=true;result.textContent='—';status.textContent='';status.setAttribute('role','status');a.node.removeAttribute('aria-invalid');b.node.removeAttribute('aria-invalid');
      }
      a.node.addEventListener('input',invalidate);b.node.addEventListener('input',invalidate);
      form.addEventListener('submit',event=>{
        event.preventDefault();invalidate();
        try {
          const value=calculate(spec.id,a.node.value,b.node.value),text=format(value);
          copyValue=text+(spec.id==='of'?'':'%'); result.textContent=copyValue;copy.disabled=false;
          if(spec.id==='change')status.textContent=value>0?'Increase':value<0?'Decrease':'No change';
        } catch(error) {status.setAttribute('role','alert');status.textContent=error.message;a.node.setAttribute('aria-invalid','true');b.node.setAttribute('aria-invalid','true');}
      });
      copy.addEventListener('click',async()=>{
        if(copyValue===null)return;
        const text=copyValue, version=generation;
        try {
          if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(text);
          if(version===generation)status.textContent='Copied '+text;
        } catch(error) {
          if(version!==generation)return;
          status.textContent='Copy unavailable. Select the result and copy it manually.';
          const range=document.createRange();range.selectNodeContents(result);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
        }
      });
      actions.append(calculateButton,result,copy);form.append(sentence,actions);card.append(form,status,help);container.append(card);
    }
    container.append(el('p','Results display and copy rounded to one decimal place. Percentage change uses a positive starting value; a negative result indicates a decrease.',{class:'note'}));
  }
  const api = {calculate,format,mount};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.PercentageCalculator = api;
})(typeof window !== 'undefined' ? window : globalThis);
