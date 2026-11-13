import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Cloudflare Pages redirects", () => {
  it("serves dynamic details and CMS through separate SPA shells", () => {
    const redirects = readFileSync(resolve(process.cwd(), "public/_redirects"), "utf8");

    expect(redirects.trim().split("\n").slice(-5)).toEqual([
      "/trips/:slug /wyjazdy/:slug 301",
      "/wyjazdy/:slug /_shell/app 200",
      "/obozy/:slug /_shell/app 200",
      "/admin /_shell/admin 200",
      "/admin/* /_shell/admin 200",
    ]);
  });

  it("permanently redirects legacy WordPress paths to their final URLs", () => {
    const rules = readFileSync("public/_redirects", "utf8").trim().split("\n");
    const destinations = {
      "/eventy/": ["/skimboarding", "/zorganizuj-event"],
      "/o-nas/": ["/szkolenia", "/skateboarding-2"],
      "/wypozyczalnia/": ["/serwis"],
      "/kontakt/": [
        "/pliki-cookies",
        "/polityka-cookies",
        "/polityka-prywatnosci",
        "/regulamin-strony-2",
      ],
      "/wyjazdy/": [
        "/snowboard",
        "/surfing",
        "/surfing/surfcamp-portugalia",
        "/surfing/surfcamp-maroko",
        "/home/livigno_pierwszy_snieg_2022",
        "/home/oboz_zimowy-podhale",
        "/home/oboz_zimowy-freestyle",
        "/home/family-weekend-trzech-kroli",
        "/zimowiska-z-impaktem",
        "/spring-break-2025",
        "/livigno-dreams",
        "/polkolonie-wake-3",
        "/polkolonie-wake",
        "/folgarida-marilleva-2027",
        "/folgarida-marilleva-2027-2",
        "/livigno-kwiecien-2027",
      ],
      "/": [
        "/home-new",
        "/zapisy",
        "/blog",
        "/witaj-swiecie",
        "/2734-2",
        "/news2",
        "/category/bez-kategorii",
      ],
    };
    for (const [destination, sources] of Object.entries(destinations)) {
      for (const source of sources) {
        expect(rules).toContain(`${source} ${destination} 301`);
        expect(rules).toContain(`${source}/ ${destination} 301`);
      }
    }
  });
});
