const fs = require('fs');
const file = 'backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Update create params
code = code.replace(
  'billDate?: string | null;\n  }) {',
  'billDate?: string | null;\n    createdBy?: string;\n    updatedBy?: string;\n  }) {'
);

// Update create db map
code = code.replace(
  'billDate: data.billDate\n        }\n      });',
  'billDate: data.billDate,\n          createdBy: data.createdBy,\n          updatedBy: data.updatedBy\n        }\n      });'
);

// Update create history map
code = code.replace(
  'billDate: entry.billDate\n        }\n      });',
  'billDate: entry.billDate,\n          createdBy: entry.createdBy,\n          updatedBy: entry.updatedBy\n        }\n      });'
);

// Update update params
code = code.replace(
  'billDate?: string | null;\n  }) {',
  'billDate?: string | null;\n    updatedBy?: string;\n  }) {'
);

// Update update db map
code = code.replace(
  'billDate: data.billDate\n        }\n      });',
  'billDate: data.billDate,\n          updatedBy: data.updatedBy\n        }\n      });'
);

// Update update history map (if it exists like create history)
code = code.replace(
  'billDate: entry.billDate\n        }\n      });',
  'billDate: entry.billDate,\n          createdBy: entry.createdBy,\n          updatedBy: entry.updatedBy\n        }\n      });'
);

fs.writeFileSync(file, code);
console.log("Updated service");
