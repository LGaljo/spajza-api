import { env } from '../config/env';
import chalk from 'chalk';
import fs from 'fs';
import { ngram, tokenize } from 'ngramable';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { ChangeType } from '../modules/tracing/schema/change.enum';

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
  const keys = _.union(
    // Object.keys(before._doc),
    Object.keys(now),
  );
  console.log(before._doc, Object.keys(before._doc));
  console.log(now, Object.keys(now));
  // console.log(keys);
  for (const key of keys) {
    if (['_id', '__v', 'nngrams'].includes(key)) {
      // skip
    } else if (!before[key] && now[key]) {
      changes.push({
        key,
        valueBefore: before[key],
        valueNow: now[key],
        type: ChangeType.ADDED,
      });
    } else if (before[key] && !now[key]) {
      changes.push({
        key,
        valueBefore: before[key],
        valueNow: now[key],
        type: ChangeType.REMOVED,
      });
    } else if (before[key] !== now[key]) {
      if (deepCompare(before[key], now[key])) {
        changes.push({
          key,
          valueBefore: before[key],
          valueNow: now[key],
          type: ChangeType.CHANGED,
        });
      }
    }
  }
  return changes;
}

function deepCompare(before: any, now: any) {
  if (before instanceof Date) {
    if (new Date(before).getTime() === new Date(now).getTime()) {
      return false;
    }
  } else if (before instanceof ObjectId) {
    if (before.toString() === now.toString()) {
      return false;
    }
  } else if (before instanceof Array) {
    if (_.difference(before, now).length === 0) {
      return false;
    }
  }

  return true;
}
