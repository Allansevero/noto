const potrace = require('potrace');
const fs = require('fs');

const inputFile = 'src/assets/logo noto.png';
const outputFile = 'src/assets/logo.svg';

potrace.trace(inputFile, {
    color: '#000000',
    background: 'transparent',
    threshold: 120,
    optCurve: true,
    optTolerance: 0.2
}, function(err, svg) {
  if (err) {
      console.error(err);
      process.exit(1);
  }
  fs.writeFileSync(outputFile, svg);
  console.log(`Successfully vectorized ${inputFile} to ${outputFile}`);
});
