fetch('http://13.203.106.159:5001/api/resource-center/ists-charges').then(res => res.json()).then(data => { console.log(JSON.stringify(data.data[0], null, 2)); }).catch(console.error);
