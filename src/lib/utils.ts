import { env } from '../config/env';
import chalk from 'chalk';
import fs from 'fs';
import { ngram, tokenize } from 'ngramable';
import * as _ from 'lodash';

export function getCurrentDateNow() {
  return new Date().toISOString();
}

export function writeToFile(string) {
  const destination = (env.ON_LINUX ? '/home/pi/nodejs/' : './') + 'RelayLog.txt';

  try {
    fs.appendFile(destination, string + '\n', function (err) {
      if (err) console.log(chalk.red('Error while I/O operation'));
    });
  } catch (e) {
    console.log(chalk.red('Error writing to log file'));
  }
}

export function toNgrams(value: string) {
  if (!value) {
    return null;
  }

  return tokenize(value)
    .map((t) => ngram(t, { min: 1, max: 15, style: 2 }))
    .reduce((a, b) => a.concat(b), [])
    .map((t) => t.toLowerCase())
    .join(' ');
}

export function getObjectDiff(before: any, now: any) {
  const changes = [];
  const keys = _.union(Object.keys(before), Object.keys(now));
  for (const key of keys) {
    if (!before[key] && now[key]) {
      changes.push({
        key,
        valueBefore: before[key],
        valueNow: now[key],
        type: 'added',
      });
    } else if (before[key] && !now[key]) {
      changes.push({
        key,
        valueBefore: before[key],
        valueNow: now[key],
        type: 'removed',
      });
    } else if (before[key] !== now[key]) {
      changes.push({
        key,
        valueBefore: before[key],
        valueNow: now[key],
        type: 'changed',
      });
    }
  }
  return changes;
}
