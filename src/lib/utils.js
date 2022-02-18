import latinize from 'latinize';

export function makeSlug(name) {
  name.replace(' ', '-');
  return latinize(name);
}
