const Filter = require("@thisshu/bad-words");
const filter = new Filter({ placeHolder: "-" });
filter.addWords(
  "selfbot",
  "cheat",
  "hack",
  "kys",
  "ddos",
  "dox",
  "dos",
  "nig",
  "black",
  "people",
  "hvh",
  "ni",
  "ip",
  "address"
);

module.exports = filter;
