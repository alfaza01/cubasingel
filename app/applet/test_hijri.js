const date = new Date('2026-06-10');
const formatted = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        calendar: 'islamic-umalqura'
      }).format(date);
console.log(formatted);
const formattedDay = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        calendar: 'islamic-umalqura'
      }).format(date);
console.log(formattedDay);
