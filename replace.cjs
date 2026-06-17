const fs = require('fs');

let input = fs.readFileSync('src/pages/Pos.tsx', 'utf8');

input = input.replace(/import \{ supabase \} from '\.\.\/lib\/supabase';/, `import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router';`);

input = input.replace(/export default function PosKasirView\(\{([^\}]+)\}: Props\) \{/, 'function PosKasirView({$1}: Props) {');

const mockSupabase = `
const localSupabase = {
  from: (table) => {
    const getKey = (storeId) => \`alphaPro_\${storeId}_\${table}\`;
    return {
      select: (fields) => ({
        eq: (col, val) => ({
          order: (col2, opts) => ({
            limit: (n) => {
              if (table === 'transactions') return Promise.resolve({ data: [] });
              return new Promise(res => {
                 const data = JSON.parse(localStorage.getItem(getKey(val)) || '[]');
                 res({ data, error: null });
              });
            }
          }),
          then: (cb) => {
             const data = JSON.parse(localStorage.getItem(getKey(val)) || '[]');
             cb({ data, error: null });
          }
        })
      }),
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
      update: (payload) => ({
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
      }),
      delete: () => ({
        eq: (col, id) => {
          return new Promise(res => {
             const key = getKey('default');
             let data = JSON.parse(localStorage.getItem(key) || '[]');
             data = data.filter(x => x[col] !== id);
             localStorage.setItem(key, JSON.stringify(data));
             res({ error: null });
          });
        }
      })
    };
  }
};
`

input = input.replace('const fmt = (n: number)', mockSupabase + '\nconst fmt = (n: number)');
input = input.replace(/supabase/g, 'localSupabase');

const wrapper = `
export function Pos() {
  const { storeName, cashierName, addTransaction } = useStore();
  const navigate = useNavigate();
  return <PosKasirView 
     active={true}
     isPc={false}
     setActiveView={() => navigate(-1)}
     showToast={(msg) => alert(msg)}
     onConfirm={(title, msg, cb) => { if (window.confirm(title+'\\n'+msg)) cb(); }}
     activeStoreId="default"
     kasirName={cashierName || "KASIR"}
     onSaveAksesorisTx={(items, grandTotal, payMethod) => {
        addTransaction(items as any, grandTotal, 'INCOME', 'POS KASIR ' + payMethod);
     }}
     storeName={storeName || "Toko Saya"}
  />;
}
`

fs.writeFileSync('src/pages/Pos.tsx', input + '\n' + wrapper);
