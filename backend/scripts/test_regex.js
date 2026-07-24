const text = '<span class="value_DemandMET_en value_StateDetails_en"><span style="display: inline-block;">         21,350&nbsp;MW</span></span>';
const regex = /<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/;
console.log(text.match(regex));
