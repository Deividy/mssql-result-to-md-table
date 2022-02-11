#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const stream = require('stream');

function printHeaderLine(line) {
    process.stdout.write(`| ${line} |\n`);

    const out = line.split('|') .map(() => ' :-- ').join('|');
    process.stdout.write(`| ${out} |\n`);
}

(async () => {
    const argFilePath = process.argv[2];

    if (!argFilePath) {
        throw new Error([
            'You must pass the filepath for your resultset',
            'e.g: npx mssql-result-to-md-table /my/path/to/file'
        ].join('\n'));
    }

    const filepath = path.resolve(argFilePath);
    const readStream = fs.createReadStream(filepath);

    readStream.on('open', () => {
        let isFirstLine = true;
        let lineRest = '';

        readStream.pipe(new stream.Writable({
            write(chunk, _encoding, done) {
                const str = chunk.toString().replace(/\t/g, ' | ');

                if (!str.includes('\n')) {
                    lineRest += str;
                    return done();
                }

                const lineParts = (lineRest + str).split(/\n/g);
                while (lineParts.length > 1) {
                    const line = lineParts.shift();

                    if (isFirstLine) {
                        printHeaderLine(line);
                        isFirstLine = false;
                        continue;
                    }

                    process.stdout.write(`| ${line} |\n`);
                }

                lineRest = lineParts[0];
                done();
            },

            final() {
                if (!lineRest) { return; }
                if (isFirstLine) {
                    printHeaderLine(lineRest);
                    return;
                }

                process.stdout.write(`| ${lineRest} |`);
            }
        }));
    });
})();
