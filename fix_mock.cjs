const fs = require('fs');
let code = fs.readFileSync('src/pages/Pos.tsx', 'utf8');

const regex = /const localSupabase = \{[\s\S]*?\};\n\nconst fmt =/m;

const newMock = `const localSupabase = {
  from: (table) => {
    const getKey = (storeId) => \`alphaPro_\${storeId}_\${table}\`;
    return {
      select: (fields) => {
         let currentVal = 'default';
         const chain = {
            eq: (col, val) => {
               currentVal = val;
               return chain;
            },
            ilike: (col, val) => {
               return chain;
            },
            order: (col, opts) => {
               return chain;
            },
            limit: (n) => {
               return chain;
            },
            then: (resolve, reject) => {
               if (table === 'transactions') {
                  return resolve({ data: [], error: null });
               }
               let data = JSON.parse(localStorage.getItem(getKey(currentVal)) || '[]');
               if (table === 'pos_products') {
                  const key2 = getKey('default');
                  data = JSON.parse(localStorage.getItem(key2) || '[]');
               }
               resolve({ data, error: null });
            }
         };
         return chain;
      },
      insert: (recordOrArray) => {
        return new Promise(res => {
            const temp = Array.isArray(recordOrArray) ? recordOrArray[0] : recordOrArray;
            const records = Array.isArray(recordOrArray) ? recordOrArray : [recordOrArray];
            if (table === 'transactions') return res({ error: null });
            const key = getKey(temp.store_id || 'default');
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            data.push(...records);
            localStorage.setItem(key, JSON.stringify(data));
            res({ error: null });
        });
      },
      update: (payload) => {
         const chain = {
            eq: (col, id) => {
               return new Promise(res => {
                  const key = getKey('default');
                  const data = JSON.parse(localStorage.getItem(key) || '[]');
                  const i = data.findIndex(x => x[col] === id);
                  if(i >= 0) {
                     data[i] = { ...data[i], ...payload };
                     localStorage.setItem(key, JSON.stringify(data));
                  }
                  res({ error: null });
               });
            }
         };
         return chain;
      },
      delete: () => {
         const chain = {
            eq: (col, id) => {
               return new Promise(res => {
                  const key = getKey('default');
                  let data = JSON.parse(localStorage.getItem(key) || '[]');
                  data = data.filter(x => x[col] !== id);
                  localStorage.setItem(key, JSON.stringify(data));
                  res({ error: null });
               });
            }
         };
         return chain;
      }
    };
  }
};

const fmt =`;

code = code.replace(regex, newMock);
fs.writeFileSync('src/pages/Pos.tsx', code);
