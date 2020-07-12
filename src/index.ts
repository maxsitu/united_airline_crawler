import "./env";
import {Crawler} from "./crawler";
import {readFileSync} from "fs";

const { program } = require('commander');
program.version("1.0")
  .option('-s, --sitefile [sitefile]', "The path to site.json file", (val) => val.toString())
  .parse(process.argv);

let json = JSON.parse(readFileSync(program.sitefile).toString());
let c = new Crawler(json["baseUrl"], json["phoneNumber"]);

c.crawl(json);
