async function run() {
  const res = await fetch('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/2024.json');
  console.log(res.ok);
  const res2 = await fetch('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/api/2024.json');
  console.log(res2.ok);
}
run();
