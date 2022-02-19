import latinize from 'latinize';

export function makeSlug(name) {
  let n = name;
  while (n.includes(' ')) {
    n = n.replace(' ', '-');
}
  return latinize(n);
}
