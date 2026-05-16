// ============================================================
// NIKKE UNIT DATABASE
// Add each character as one line inside the array below.
//
// FIELDS:
//   id          - unique slug, lowercase, no spaces (use hyphens)
//   name        - display name exactly as you want it shown
//   manufacturer- one of: Elysion | Missilis | Tetra | Pilgrim | Abnormal
//   burst       - one of: I | II | III
//   element     - one of: Fire | Water | Wind | Iron | Electric
//   rarity      - one of: SSR | SR | R
//   image       - full image URL (right-click icon on nikke.gg → Copy image address)
//
// EXAMPLE:
// {id:'liter', name:'Liter', manufacturer:'Missilis', burst:'I', element:'Iron', rarity:'SSR', image:'https://...webp'},
//
// TIPS:
//   - Copy the example line, paste it below, change the values
//   - The list is sorted by rarity (SSR first) then alphabetically automatically
//   - Characters with the same id as an existing one will overwrite it
//   - Leave image blank if you don't have it: the app will show a ? placeholder
// ============================================================

var NIKKE_UNITS = [
    { id: 'liter', name: 'Liter', manufacturer: 'Missilis', burst: 'I', element: 'Iron', rarity: 'SSR', image: 'https://nikke-db-legacy.pages.dev/images/sprite/si_c082_00_s.png' },
    { id: 'crown', name: 'Crown', manufacturer: 'Pilgrim', burst: 'II', element: 'Iron', rarity: 'SSR', image: 'https://nikke-db-legacy.pages.dev/images/sprite/si_c330_01_00_s.png' },
    { id: 'emma', name: 'Emma', manufacturer: 'Elysion', burst: 'I', element: 'Fire', rarity: 'SSR', image: 'https://nikke-db-legacy.pages.dev/images/sprite/si_c090_00_s.png' },
    { id: 'emma_techtical_upgrade', name: 'Emma: Techtical Upgrade', manufacturer: 'Elysion', burst: 'I', element: 'Fire', rarity: 'SSR', image: 'https://nikke-db-legacy.pages.dev/images/sprite/si_c093_00_s.png' },
];