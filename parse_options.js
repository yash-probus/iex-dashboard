const fs = require('fs');

const text = fs.readFileSync('iex_calc.js', 'utf8');

// The file has something like:
// (s=h||(h={})).DamanDiu="Daman & Diu",s.UttarPradesh="Uttar Pradesh",...
// (l=c||(c={})).V11="11",l.V33="33",...
// (n=u||(u={})).EnergyIntensive="Energy Intensive",n.Commercial="Commercial",n.IndustrialGeneral="Industrial General"
// (o=x||(x={})).ALL_MONTHS="All Months",...
// (i=g||(g={})).NORMAL_0700_1800="Normal (0700 - 1800 hrs)",...

function extract(regexStr) {
    const regex = new RegExp(regexStr, 'g');
    const matches = [...text.matchAll(regex)];
    const items = [];
    for (const match of matches) {
        items.push(`"${match[1]}"`);
    }
    return `[${items.join(', ')}]`;
}

// 1. States (e.g. s.UttarPradesh="Uttar Pradesh")
// Note: Some have s. prefix, but initially it's (s=h||(h={})).DamanDiu="Daman & Diu"
// We can just extract all "..." after = for each block
const extractBlock = (prefix) => {
    // Find where the block starts, e.g. h={} or c={}
    // The structure is like `,s.UttarPradesh="Uttar Pradesh"`
    // Let's just use regex to match all string literals in the chunks.
}

// Alternatively, let's just use regex to find all matches of property assignments.
const stateMatches = text.match(/\(s=h\|\|\(h=\{\}\)\)\.[A-Za-z]+="([^"]+)"|s\.[A-Za-z]+="([^"]+)"/g);
const states = stateMatches.map(m => m.split('="')[1].slice(0, -1));

const voltMatches = text.match(/\(l=c\|\|\(c=\{\}\)\)\.[A-Za-z0-9]+="([^"]+)"|l\.[A-Za-z0-9]+="([^"]+)"/g);
const volts = voltMatches.map(m => m.split('="')[1].slice(0, -1));

const catMatches = text.match(/\(n=u\|\|\(u=\{\}\)\)\.[A-Za-z]+="([^"]+)"|n\.[A-Za-z]+="([^"]+)"/g);
const cats = catMatches.map(m => m.split('="')[1].slice(0, -1));

const monthMatches = text.match(/\(o=x\|\|\(x=\{\}\)\)\.[A-Za-z_]+="([^"]+)"|o\.[A-Za-z_]+="([^"]+)"/g);
const months = monthMatches.map(m => m.split('="')[1].slice(0, -1));

const todMatches = text.match(/\(i=g\|\|\(g=\{\}\)\)\.[A-Za-z0-9_]+="([^"]+)"|i\.[A-Za-z0-9_]+="([^"]+)"/g);
const tods = todMatches.map(m => m.split('="')[1].slice(0, -1));

console.log("STATES:", JSON.stringify(states));
console.log("CATEGORIES:", JSON.stringify(cats));
console.log("VOLTAGES:", JSON.stringify(volts));
console.log("TOD_MONTHS:", JSON.stringify(months));
console.log("TOD_SLOTS:", JSON.stringify(tods));

