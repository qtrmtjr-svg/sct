const logo = {
  ABK: "/knet/banks/abk.svg",
  BBK: "/knet/banks/bbk.svg",
  Boubyan: "/knet/banks/boubyan.svg",
  Burgan: "/knet/banks/burgan.svg",
  CBK: "/knet/banks/cbk.svg",
  Doha: "/knet/banks/doha.svg",
  GBK: "/knet/banks/gbk.svg",
  KFH: "/knet/banks/kfh.svg",
  KIB: "/knet/banks/kib.svg",
  NBK: "/knet/banks/nbk.svg",
  QNB: "/knet/banks/qnb.svg",
  Rajhi: "/knet/banks/rajhi.svg",
  TAM: "/knet/banks/tam.svg",
  Warba: "/knet/banks/warba.svg",
  Weyay: "/knet/banks/weyay.svg",
} as const;

export const knetCards = [
  { bin: "403622", brand: "ABK", logo: logo.ABK },
  { bin: "423826", brand: "ABK", logo: logo.ABK },
  { bin: "42403256", brand: "ABK", logo: logo.ABK },
  { bin: "428628", brand: "ABK", logo: logo.ABK },
  { bin: "418056", brand: "BBK", logo: logo.BBK },
  { bin: "588790", brand: "BBK", logo: logo.BBK },
  { bin: "404919", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "426058", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "431199", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "450605", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "470350", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "490455", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "490456", brand: "Boubyan", logo: logo.Boubyan },
  { bin: "402978", brand: "Burgan", logo: logo.Burgan },
  { bin: "403583", brand: "Burgan", logo: logo.Burgan },
  { bin: "415254", brand: "Burgan", logo: logo.Burgan },
  { bin: "42409660", brand: "Burgan", logo: logo.Burgan },
  { bin: "450238", brand: "Burgan", logo: logo.Burgan },
  { bin: "468564", brand: "Burgan", logo: logo.Burgan },
  { bin: "49219000", brand: "Burgan", logo: logo.Burgan },
  { bin: "540759", brand: "Burgan", logo: logo.Burgan },
  { bin: "516334", brand: "CBK", logo: logo.CBK },
  { bin: "521175", brand: "CBK", logo: logo.CBK },
  { bin: "532672", brand: "CBK", logo: logo.CBK },
  { bin: "537015", brand: "CBK", logo: logo.CBK },
  { bin: "419252", brand: "Doha", logo: logo.Doha },
  { bin: "517419", brand: "GBK", logo: logo.GBK },
  { bin: "517458", brand: "GBK", logo: logo.GBK },
  { bin: "526206", brand: "GBK", logo: logo.GBK },
  { bin: "531329", brand: "GBK", logo: logo.GBK },
  { bin: "531470", brand: "GBK", logo: logo.GBK },
  { bin: "531471", brand: "GBK", logo: logo.GBK },
  { bin: "531644", brand: "GBK", logo: logo.GBK },
  { bin: "559475", brand: "GBK", logo: logo.GBK },
  { bin: "450778", brand: "KFH", logo: logo.KFH },
  { bin: "485602", brand: "KFH", logo: logo.KFH },
  { bin: "532674", brand: "KFH", logo: logo.KFH },
  { bin: "537016", brand: "KFH", logo: logo.KFH },
  { bin: "406464", brand: "KIB", logo: logo.KIB },
  { bin: "409054", brand: "KIB", logo: logo.KIB },
  { bin: "464452", brand: "NBK", logo: logo.NBK },
  { bin: "589160", brand: "NBK", logo: logo.NBK },
  { bin: "521020", brand: "QNB", logo: logo.QNB },
  { bin: "524745", brand: "QNB", logo: logo.QNB },
  { bin: "458838", brand: "Rajhi", logo: logo.Rajhi },
  { bin: "45077848", brand: "TAM", logo: logo.TAM },
  { bin: "45077849", brand: "TAM", logo: logo.TAM },
  { bin: "525528", brand: "Warba", logo: logo.Warba },
  { bin: "532749", brand: "Warba", logo: logo.Warba },
  { bin: "541350", brand: "Warba", logo: logo.Warba },
  { bin: "559459", brand: "Warba", logo: logo.Warba },
  { bin: "46445250", brand: "Weyay", logo: logo.Weyay },
  { bin: "543363", brand: "Weyay", logo: logo.Weyay },
] as const;

export function knetLogoFor(digits: string) {
  if (digits.length < 6) return "";
  let logoSrc = "";
  let length = 0;
  for (const card of knetCards) {
    if (card.bin.length > length && digits.startsWith(card.bin)) {
      logoSrc = card.logo;
      length = card.bin.length;
    }
  }
  return logoSrc;
}

export function formatKnetCard(digits: string) {
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function maskKnetCard(digits: string) {
  if (digits.length <= 6) return formatKnetCard(digits);
  if (digits.length <= 12) return formatKnetCard(`${digits.slice(0, 6)}${"•".repeat(digits.length - 6)}`);
  return formatKnetCard(`${digits.slice(0, 6)}${"•".repeat(6)}${digits.slice(12)}`);
}
