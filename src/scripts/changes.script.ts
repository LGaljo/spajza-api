import { getObjectDiff } from '../lib/utils';

(async () => {
  const object1 = {
    name: 'prvi objekt',
    kind: 'same',
    type: [1, 2, 3],
    field: 2,
  };
  const object2 = {
    name: 'drugi objekt',
    kind: 'same',
    type: [1, 2, 3, 4],
    object: 3,
  };

  console.log(JSON.stringify(getObjectDiff(object1, object2)));
  process.exit();
})().catch(async (err) => {
  console.log(err);
});
