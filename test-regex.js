const html1 = '<span class="value_DemandMET_en value_StateDetails_en"><span style="display: inline-block;">         20,145&nbsp;MW</span></span>';
const html2 = '<span class="value_DemandMET_en value_StateDetails_en"><span style="display: inline-block;">              0&nbsp;MW</span></span>';

const regex = /<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/;

console.log("Maharashtra match:", html1.match(regex));
console.log("Delhi match:", html2.match(regex));
