const hello = undefined || null || 0 || NaN || '' || 'Hello!';
const chao = ' ' && 100 && [] && {} && 'Chao!';

true && console.log('1.', hello); // 1. Hello!
false && console.log('2.', hello); // (no output)
true || console.log('3.', chao); // (no output)
false || console.log('4.', chao); // 4. Chao!